import { useConfigs } from '../../config/useConfigs'
import { ethers } from 'ethers'
import { useContract } from '../../../hooks/useContract'
import { ParseLogType, PoolType } from '../type'
import { addPoolsWithChain } from '../reducer'
import { useDispatch, useSelector } from 'react-redux'
import { State } from '../../types'
import GetStateAbi from './GetStateAbi.json'
import TokensInfoAbi from '../../../assets/abi/TokensInfo.json'
import { JsonRpcProvider } from '@ethersproject/providers'
import { ContractCallContext, Multicall } from 'ethereum-multicall'
import { addTokensReduce } from '../../token/reducer'
import { bn, getNormalAddress, numberToWei, weiToNumber } from '../../../utils/helpers'
import { decodePowers } from 'powerLib'
import { LP_PRICE_UNIT, POOL_IDS } from '../../../utils/constant'
import { usePairInfo } from '../../../hooks/usePairInfo'

const { AssistedJsonRpcProvider } = require('assisted-json-rpc-provider')

export const useListPool = () => {
  const { pools } = useSelector((state: State) => {
    return { pools: state.pools.pools }
  })
  const { configs, chainId } = useConfigs()
  const { getEventInterface } = useContract()
  const dispatch = useDispatch()
  const { getPairsInfo } = usePairInfo()

  const initListPool = async () => {
    if (!chainId || !configs.scanApi) return
    const etherProvider = new ethers.providers.StaticJsonRpcProvider(configs.rpcUrl)
    let provider = etherProvider
    const headBlock = await provider.getBlockNumber()
    if (configs.scanApi) {
      provider = new AssistedJsonRpcProvider(
        etherProvider,
        {
          url: configs.scanApi,
          maxResults: 1000,
          rangeThreshold: 1000,
          rateLimitCount: 1,
          rateLimitDuration: 5000,
          apiKeys: ['']
        }
      )
    } else {
      provider = new AssistedJsonRpcProvider(
        etherProvider
      )
    }

    const ddlLogs = await provider.getLogs({
      fromBlock: configs.ddlGenesisBlock,
      toBlock: headBlock,
      topics: [null, null, ethers.utils.formatBytes32String('DDL')]
    }).then((logs: any) => {
      const eventInterface = getEventInterface()
      return logs.map((log: any) => {
        try {
          return { address: log.address, ...eventInterface.parseLog(log) }
        } catch (e) {
          return {}
        }
      })
    })
    const ddlLogsCached = JSON.parse(localStorage.getItem('ddlLogs' + chainId) || '[]')
    localStorage.setItem('ddlLogs' + chainId, JSON.stringify([...ddlLogs, ...ddlLogsCached]))

    const { tokens, pools } = await generatePoolData(ddlLogs)

    dispatch(addTokensReduce({ tokens, chainId }))
    dispatch(addPoolsWithChain({ pools, chainId }))
  }

  /**
   * parse DDL logs
   * @param logs
   */
  const generatePoolData = (logs: ParseLogType[]) => {
    const allTokens: string[] = []
    const allUniPools: string[] = []
    const poolData = {}
    const logicData = {}
    logs.forEach((log) => {
      if (log.name === 'LogicCreated') {
        console.log('log', log)
        const powers = decodePowers(log.args.powers)
        logicData[log.address] = {
          logic: log.address,
          dTokens: powers.map((value, key) => { return { power: value, index: key } }),
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
        console.log('PoolCreated', log)
        const logic = log.args.logic
        const data = logicData[logic]

        // sort powers and dToken
        // data.powers = data.powers.sort((a: number, b: number) => a - b)
        data.dTokens = (data.dTokens as { index: number, power: number }[])
          // .sort((a, b) => a.power - b.power)
          .map((data) => `${log.args.pool}-${data.index}`)

        poolData[log.args.pool] = {
          poolAddress: log.args.pool,
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

    // @ts-ignore
    const context: ContractCallContext[] = getMultiCallRequest(normalTokens, listPools)
    const [{ results }, pairsInfo] = await Promise.all([
      multicall.call(context),
      getPairsInfo(uniPools)
    ])
    console.log('pairsInfo', pairsInfo)
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
          decimal: pairInfo.token0.decimals,
          name: pairInfo.token0.name,
          symbol: pairInfo.token0.symbol,
          totalSupply: pairInfo.token0.totalSupply
        },
        {
          address: pairInfo.token1.adr,
          decimal: pairInfo.token1.decimal,
          name: pairInfo.token1.name,
          symbol: pairInfo.token1.symbol,
          totalSupply: pairInfo.token1.totalSupply
        }
      )
    }

    console.log('pools', pools)

    return { tokens, pools }
  }

  const parseMultiCallResponse = (data: any) => {
    console.log('data', data)
    const poolStateData = data.pools.callsReturnContext
    const tokens = data.tokens.callsReturnContext[0].returnValues
    const pools = {}
    for (let i = 0; i < poolStateData.length; i++) {
      const twap = {
        LP: {
          _x: bn(poolStateData[i].returnValues[6][1][0])
        },
        base: {
          _x: bn(poolStateData[i].returnValues[6][0][0])
        }
      }
      const spot = {
        LP: {
          _x: bn(poolStateData[i].returnValues[7][1][0])
        },
        base: {
          _x: bn(poolStateData[i].returnValues[7][0][0])
        }
      }
      pools[poolStateData[i].reference] = {
        Rc: bn(poolStateData[i].returnValues[0]),
        priceScaleTimestamp: bn(poolStateData[i].returnValues[1]),
        priceScaleLong: bn(poolStateData[i].returnValues[2]),
        priceScaleShort: bn(poolStateData[i].returnValues[3]),
        oracleStore: poolStateData[i].returnValues[4],
        oracleStoreUpdated: poolStateData[i].returnValues[5],
        twap,
        spot,
        twapBase: twap.base._x,
        twapLP: twap.LP._x,
        spotBase: spot.base._x,
        spotLP: spot.LP._x,
        totalSupplies: poolStateData[i].returnValues[8].map((v: any) => bn(v)),
        rDcLong: bn(poolStateData[i].returnValues[9]),
        rDcShort: bn(poolStateData[i].returnValues[10]),
        rentRateLong: bn(poolStateData[i].returnValues[11]),
        rentRateShort: bn(poolStateData[i].returnValues[12]),
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
        reference: 'pools',
        contractAddress: listPools[i].logic,
        abi: [GetStateAbi],
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
