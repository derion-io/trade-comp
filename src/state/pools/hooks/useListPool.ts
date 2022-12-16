import { useConfigs } from '../../config/useConfigs'
import { ethers } from 'ethers'
import { useContract } from '../../../hooks/useContract'
import { ParseLogType, PoolType } from '../type'
import { addPoolsWithChain } from '../reducer'
import { useDispatch, useSelector } from 'react-redux'
import { State } from '../../types'
import TokensInfoAbi from '../../../assets/abi/TokensInfo.json'
import { JsonRpcProvider } from '@ethersproject/providers'
import { ContractCallContext, Multicall } from 'ethereum-multicall'
import { addTokensReduce } from '../../token/reducer'
import { bn, formatMultiCallBignumber, getNormalAddress, numberToWei, weiToNumber } from '../../../utils/helpers'
import { decodePowers } from 'powerLib'
import { LOCALSTORAGE_KEY, LP_PRICE_UNIT, POOL_IDS } from '../../../utils/constant'
import { usePairInfo } from '../../../hooks/usePairInfo'
import { useSwapHistory } from '../../wallet/hooks/useSwapHistory'

const { AssistedJsonRpcProvider } = require('assisted-json-rpc-provider')

const DDL_LOG_NAMES = ['LogicCreated', 'PoolCreated', 'TokenAdded']

const MAX_BLOCK = 4294967295
const TOPIC_APP = ethers.utils.formatBytes32String('DDL')

export const useListPool = () => {
  const { pools } = useSelector((state: State) => {
    return { pools: state.pools.pools }
  })
  const { configs, chainId } = useConfigs()
  const { getEventInterface, getLogicAbi } = useContract()
  const dispatch = useDispatch()
  const { getPairsInfo } = usePairInfo()
  const { addMultiSwapData } = useSwapHistory()

  const initListPool = async (account: string) => {
    if (!chainId || !configs.scanApi) return

    const etherProvider = new ethers.providers.StaticJsonRpcProvider(configs.rpcUrl)
    const etherscanConfig = configs.scanApi ? {
      url: configs.scanApi,
      maxResults: 1000,
      rangeThreshold: 0,
      rateLimitCount: 1,
      rateLimitDuration: 5000,
      apiKeys: ['']
    } : undefined

    const provider = new AssistedJsonRpcProvider(
      etherProvider,
      etherscanConfig
    )

    const lastHeadBlockCached = getLastBlockCached(account)
    initListPoolCached(account)

    const accTopic = account ? '0x' + '0'.repeat(24) + account.slice(2) : null
    provider.getLogs({
      fromBlock: lastHeadBlockCached,
      toBlock: MAX_BLOCK,
      topics: [
        null,
        [null, accTopic, null, null],
        [null, null, accTopic, null],
        [null, null, null, TOPIC_APP]
      ]
    }).then((logs: any) => {
      if (!logs?.length) {
        return [[], []]
      }
      const headBlock = logs[logs.length - 1]?.blockNumber
      const topics = getTopics()
      const ddlLogs = logs.filter((log: any) => {
        return log.address && [topics.LogicCreated, topics.PoolCreated, topics.TokenAdded].includes(log.topics[0])
      })
      const swapLogs = logs.filter((log: any) => {
        return log.address && log.topics[0] === topics.MultiSwap
      })
      cacheDdlLog({
        ddlLogs,
        swapLogs,
        headBlock,
        account
      })

      return [parseDdlLogs(ddlLogs), parseDdlLogs(swapLogs)]
    }).then(async ([ddlLogs, swapLogs]: any) => {
      if (swapLogs && swapLogs.length > 0) {
        addMultiSwapData(swapLogs, account)
      }
      if (ddlLogs && ddlLogs.length > 0) {
        const { tokens, pools } = await generatePoolData(ddlLogs)

        dispatch(addTokensReduce({ tokens, chainId }))
        dispatch(addPoolsWithChain({ pools, chainId }))
      }
    }).catch((e: any) => {
      console.error(e)
    })
  }

  const getTopics = (): {[key: string]: string} => {
    const eventInterface = getEventInterface()
    const events = eventInterface.events
    const topics: {[key: string]: string} = {}
    for (const i in events) {
      topics[events[i].name] = ethers.utils.id(i)
    }
    return topics
  }

  const getLastBlockCached = (account: string) => {
    const lastDDlBlock = Number(localStorage.getItem(chainId + '-' + LOCALSTORAGE_KEY.LAST_BLOCK_DDL_LOGS)) || configs.ddlGenesisBlock
    const lastWalletBlock = Number(localStorage.getItem(chainId + '-' + LOCALSTORAGE_KEY.SWAP_BLOCK_LOGS + '-' + account)) || configs.ddlGenesisBlock
    return Math.min(lastDDlBlock, lastWalletBlock)
  }

  const initListPoolCached = async (account: string) => {
    const ddlLogs = JSON.parse(localStorage.getItem(chainId + '-' + LOCALSTORAGE_KEY.DDL_LOGS) || '[]')
    const swapLogs = JSON.parse(localStorage.getItem(chainId + '-' + LOCALSTORAGE_KEY.SWAP_LOGS + '-' + account) || '[]')
    const [ddlLogsParsed, swapLogsParsed] = [parseDdlLogs(ddlLogs), parseDdlLogs(swapLogs)]

    if (ddlLogsParsed && ddlLogsParsed.length > 0) {
      const { tokens, pools } = await generatePoolData(ddlLogsParsed)

      dispatch(addTokensReduce({ tokens, chainId }))
      dispatch(addPoolsWithChain({ pools, chainId }))
    }
    if (swapLogsParsed && swapLogsParsed.length > 0) {
      addMultiSwapData(swapLogsParsed, account)
    }
  }

  const cacheDdlLog = ({
    swapLogs,
    ddlLogs,
    headBlock,
    account
  }: {
    swapLogs: any,
    ddlLogs: any,
    headBlock: number,
    account: string
  }) => {
    const cachedDdlLogs = JSON.parse(localStorage.getItem(chainId + '-' + LOCALSTORAGE_KEY.DDL_LOGS) || '[]')
    const newCachedDdlLogs = [...ddlLogs, ...cachedDdlLogs].filter((log, index, self) => {
      return index === self.findIndex((t) => (
        t.logIndex === log.logIndex
      ))
    })
    localStorage.setItem(chainId + '-' + LOCALSTORAGE_KEY.LAST_BLOCK_DDL_LOGS, headBlock.toString())
    localStorage.setItem(chainId + '-' + LOCALSTORAGE_KEY.DDL_LOGS, JSON.stringify(newCachedDdlLogs))
    if (account) {
      const cachedSwapLogs = JSON.parse(localStorage.getItem(chainId + '-' + LOCALSTORAGE_KEY.SWAP_LOGS + '-' + account) || '[]')
      const newCacheSwapLogs = [...swapLogs, ...cachedSwapLogs].filter((log, index, self) => {
        return index === self.findIndex((t) => (
          t.logIndex === log.logIndex
        ))
      })

      localStorage.setItem(chainId + '-' + LOCALSTORAGE_KEY.SWAP_BLOCK_LOGS + '-' + account, headBlock.toString())
      localStorage.setItem(chainId + '-' + LOCALSTORAGE_KEY.SWAP_LOGS + '-' + account, JSON.stringify(newCacheSwapLogs))
    }
  }

  const parseDdlLogs = (ddlLogs: any) => {
    const eventInterface = getEventInterface()

    return ddlLogs.map((log: any) => {
      try {
        return {
          address: log.address,
          timeStamp: Number(log.timeStamp),
          transactionHash: log.transactionHash,
          blockNumber: log.blockNumber,
          index: log.logIndex,
          logIndex: log.transactionHash + '-' + log.logIndex,
          ...eventInterface.parseLog(log)
        }
      } catch (e) {
        return {}
      }
    })
  }

  /**
   * parse DDL logs
   * @param logs
   */
  const generatePoolData = (logs: ParseLogType[]) => {
    console.log('logs', logs)
    const allTokens: string[] = []
    const allUniPools: string[] = []
    const poolData = {}
    const logicData = {}
    logs.forEach((log) => {
      if (log.name === 'LogicCreated') {
        const powers = decodePowers(log.args.powers)
        logicData[log.address] = {
          logic: log.address,
          dTokens: powers.map((value, key) => {
            return { power: value, index: key }
          }),
          baseToken: log.args.baseToken,
          baseSymbol: ethers.utils.parseBytes32String(log.args.baseSymbol),
          quoteSymbol: ethers.utils.parseBytes32String(log.args.quoteSymbol),
          cToken: log.args.cToken,
          priceToleranceRatio: log.args.priceToleranceRatio,
          rentRate: log.args.rentRate,
          deleverageRate: log.args.deleverageRate,
          powers
        }
      }
    })

    logs.forEach((log) => {
      if (log.name === 'PoolCreated') {
        const logic = log.args.logic
        const data = logicData[logic]

        data.dTokens = (data.dTokens as { index: number, power: number }[])
          .map((data) => `${log.address}-${data.index}`)

        poolData[log.address] = {
          poolAddress: log.address,
          ...data
        }
        allUniPools.push(data.cToken)
        allTokens.push(...data.dTokens, data.cToken, data.baseToken)
      }
    })

    return loadStatesData(allTokens, poolData, allUniPools)
  }

  /**
   * load Token detail, poolstate data and then dispatch to Store
   * @param listTokens
   * @param listPools
   */
  const loadStatesData = async (listTokens: string[], listPools: { [key: string]: PoolType }, uniPools: string[]) => {
    const provider = new JsonRpcProvider(configs.rpcUrl)
    const multicall = new Multicall({
      multicallCustomContractAddress: configs.addresses.multiCall,
      ethersProvider: provider,
      tryAggregate: true
    })
    const normalTokens = getNormalAddress(listTokens)

    console.log('listPools', listPools)

    // @ts-ignore
    const context: ContractCallContext[] = getMultiCallRequest(normalTokens, listPools)
    const [{ results }, pairsInfo] = await Promise.all([
      multicall.call(context),
      getPairsInfo(uniPools)
    ])

    const { tokens: tokensArr, poolsState } = parseMultiCallResponse(results)
    const tokens = []
    for (let i = 0; i < tokensArr.length; i++) {
      tokens.push({
        symbol: tokensArr[i][0],
        name: tokensArr[i][1],
        decimal: tokensArr[i][2],
        totalSupply: tokensArr[i][3],
        address: normalTokens[i]
      })
    }

    const pools = { ...listPools }
    for (const i in pools) {
      const { baseToken, powers } = pools[i]
      const pairInfo = pairsInfo[pools[i].cToken]
      const quoteToken = pairInfo.token0.adr === baseToken ? pairInfo.token1.adr : pairInfo.token0.adr
      const [baseId, quoteId] = pairInfo.token0.adr === baseToken
        ? [POOL_IDS.token0, POOL_IDS.token1]
        : [POOL_IDS.token1, POOL_IDS.token0]

      pools[i].states = poolsState[i]
      pools[i].quoteToken = quoteToken
      pools[i].baseId = baseId
      pools[i].quoteId = quoteId
      pools[i].basePrice = getBasePrice(pairInfo, baseToken)
      pools[i].cPrice = bn(pools[i].states.twapLP).mul(LP_PRICE_UNIT).shr(112).toNumber() / LP_PRICE_UNIT

      powers.forEach((power, key) => {
        tokens.push({
          symbol: pools[i].baseSymbol + '^' + power,
          name: pools[i].baseSymbol + '^' + power,
          decimal: 18,
          totalSupply: 0,
          address: i + '-' + key
        })
      })
      tokens.push(
        {
          symbol: 'DDL-CP',
          name: 'DDL-CP',
          decimal: 18,
          totalSupply: 0,
          address: i + '-' + POOL_IDS.cp
        },
        {
          address: pairInfo.token0.adr,
          decimal: pairInfo.token0.decimals?.toNumber(),
          name: pairInfo.token0.name,
          symbol: pairInfo.token0.symbol,
          totalSupply: pairInfo.token0.totalSupply
        },
        {
          address: pairInfo.token1.adr,
          decimal: pairInfo.token1.decimals?.toNumber(),
          name: pairInfo.token1.name,
          symbol: pairInfo.token1.symbol,
          totalSupply: pairInfo.token1.totalSupply
        }
      )
    }

    return { tokens, pools }
  }

  const parseMultiCallResponse = (data: any) => {
    const abiInterface = new ethers.utils.Interface(getLogicAbi())
    const poolStateData = data.pools.callsReturnContext
    const tokens = data.tokens.callsReturnContext[0].returnValues
    const pools = {}
    for (let i = 0; i < poolStateData.length; i++) {
      const data = formatMultiCallBignumber(poolStateData[i].returnValues)
      const encodeData = abiInterface.encodeFunctionResult('getStates', [data])
      const formatedData = abiInterface.decodeFunctionResult('getStates', encodeData)

      pools[poolStateData[i].reference] = {
        twapBase: formatedData.states.twap.base._x,
        twapLP: formatedData.states.twap.LP._x,
        spotBase: formatedData.states.spot.base._x,
        spotLP: formatedData.states.spot.LP._x,
        ...formatedData.states
      }
    }

    return { tokens, poolsState: pools }
  }

  /**
   * get Multicall Request to get List token and poolState data in 1 request to RPC
   * @param listTokens
   * @param listPools
   */
  const getMultiCallRequest = (normalTokens: string[], listPools: { [key: string]: PoolType }) => {
    const request = [
      {
        reference: 'tokens',
        contractAddress: configs.addresses.tokensInfo,
        abi: TokensInfoAbi,
        calls: [{ reference: 'tokenInfos', methodName: 'getTokenInfo', methodParameters: [normalTokens] }]
      }
    ]

    for (const i in listPools) {
      request.push({
        // @ts-ignore
        decoded: true,
        reference: 'pools',
        contractAddress: listPools[i].logic,
        // @ts-ignore
        abi: getLogicAbi(),
        calls: [{ reference: i, methodName: 'getStates', methodParameters: [] }]
      })
    }

    return request
  }

  const getBasePrice = (pairInfo: any, baseToken: string) => {
    const token0 = pairInfo.token0.adr
    const r0 = pairInfo.token0.reserve
    const r1 = pairInfo.token1.reserve
    const [rb, rq] = token0 === baseToken ? [r0, r1] : [r1, r0]
    return weiToNumber(rq.mul(numberToWei(1)).div(rb))
  }

  return { initListPool, pools: pools[chainId] }
}
