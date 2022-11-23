import { useConfigs } from '../../config/useConfigs'
import { BigNumber, ethers } from 'ethers'
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
import { bn, getNormalAddress } from '../../../utils/helpers'
import { decodePowers } from 'powerLib'

const { AssistedJsonRpcProvider } = require('assisted-json-rpc-provider')

export const useListPool = () => {
  const { pools } = useSelector((state: State) => {
    return { pools: state.pools.pools }
  })
  const { configs, chainId } = useConfigs()
  const { getEventInterface } = useContract()
  const dispatch = useDispatch()

  const initListPool = async () => {
    if (!chainId || !configs.scanApi) return
    const etherProvider = new ethers.providers.StaticJsonRpcProvider(configs.rpcUrl)
    let provider = etherProvider
    const headBlock = await provider.getBlockNumber()
    provider = new AssistedJsonRpcProvider(
      etherProvider
      // {
      //   url: configs.scanApi,
      //   maxResults: 1000,
      //   rangeThreshold: 1000,
      //   rateLimitCount: 1,
      //   rateLimitDuration: 5000,
      //   apiKeys: ['']
      // }
    )
    console.log(configs.ddlGenesisBlock, headBlock, ethers.utils.formatBytes32String('DDL'))
    const ddlLogs = await provider.getLogs({
      fromBlock: configs.ddlGenesisBlock,
      toBlock: headBlock,
      topics: [null, null, ethers.utils.formatBytes32String('DDL')]
    }).then((logs: any) => {
      console.log('ddl logs', logs)
      const eventInterface = getEventInterface()
      return logs.map((log: any) => {
        return { address: log.address, ...eventInterface.parseLog(log) }
      })
    })
    const { tokens, pools } = await generatePoolData(ddlLogs)
    console.log({
      tokens, pools
    })

    dispatch(addTokensReduce({ tokens, chainId }))
    dispatch(addPoolsWithChain({ pools, chainId }))
  }

  /**
   * parse DDL logs
   * @param logs
   */
  const generatePoolData = (logs: ParseLogType[]) => {
    const allTokens: string[] = []
    const poolData = {}
    const logicData = {}
    logs.forEach((log) => {
      if (log.name === 'LogicCreated') {
        console.log('log', log)
        const powers = decodePowers(log.args.powers)
        logicData[log.address] = {
          logic: log.address,
          dTokens: powers.map((value, key) => key),
          baseToken: log.args.baseToken,
          baseSymbol: ethers.utils.parseBytes32String(log.args.baseSymbol),
          quoteSymbol: ethers.utils.parseBytes32String(log.args.quoteSymbol),
          cToken: log.args.cToken,
          priceToleranceRatio: log.args.priceToleranceRatio,
          rentRate: log.args.rentRates,
          powers
        }
      }
    })

    // logs.forEach((log) => {
    //   if (log.name === 'DTokenCreated') {
    //     if (logicData[log.args.logic] && logicData[log.args.logic].dTokens) {
    //       const index = log.args.index.toNumber()
    //       console.log('DTokenCreated', log.args)
    //       logicData[log.args.logic].dTokens[index] = {
    //         address: log.args.token,
    //         power: logicData[log.args.logic].powers[index]
    //       }
    //     }
    //   }
    // })

    logs.forEach((log) => {
      if (log.name === 'PoolCreated') {
        console.log('PoolCreated', log)
        const logic = log.args.logic
        const data = logicData[logic]

        // sort powers and dToken
        data.powers = data.powers.sort((a: number, b: number) => a - b)
        data.dTokens = (data.dTokens as { address: string, power: number }[])
          .sort((a, b) => a.power - b.power)
          .map((token) => `${log.args.pool}-${token}`)

        poolData[log.args.pool] = {
          poolAddress: log.args.pool,
          ...data
        }
        allTokens.push(...data.dTokens, data.cToken, data.baseToken)
      }
    })

    console.log('poolData', poolData)

    return loadStatesData(allTokens, poolData)
  }

  /**
   * load Token detail, poolstate data and then dispatch to Store
   * @param listTokens
   * @param listPools
   */
  const loadStatesData = async (listTokens: string[], listPools: { [key: string]: PoolType }) => {
    const provider = new JsonRpcProvider(configs.rpcUrl)
    const multicall = new Multicall({
      multicallCustomContractAddress: configs.addresses.multiCall,
      ethersProvider: provider,
      tryAggregate: true
    })
    const normalTokens = getNormalAddress(listTokens)

    // @ts-ignore
    const context: ContractCallContext[] = getMultiCallRequest(normalTokens, listPools)
    const { results } = await multicall.call(context)
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
      pools[i].states = poolsState[i]
      const powers = pools[i].powers
      powers.forEach((power, key) => {
        tokens.push({
          symbol: pools[i].baseSymbol + '^' + power,
          name: pools[i].baseSymbol + '^' + power,
          decimal: 18,
          totalSupply: 0,
          address: i + '-' + key
        })
      })
    }

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
        twap,
        spot,
        twapBase: twap.base._x,
        twapLP: twap.LP._x,
        spotBse: spot.base._x,
        spotLP: spot.LP._x
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

  return { initListPool, pools: pools[chainId] }
}
