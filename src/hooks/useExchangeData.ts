import { gql, GraphQLClient } from 'graphql-request'
import { useConfigs } from '../state/config/useConfigs'
import { BigNumber, ethers } from 'ethers'
import { formatFloat } from '../utils/helpers'
// eslint-disable-next-line no-unused-vars
import {
  encodeCLFeedCacheKey,
  LINE_CHART_CONFIG,
  LineChartIntervalType
} from '../utils/lineChartConstant'
import { Interface } from 'ethers/lib/utils'
import {useEffect, useLayoutEffect, useState} from 'react'
import {PriceFeedData, PriceFeedDataCache} from '../state/linechart/type'
import {useDispatch, useSelector} from 'react-redux'
import {State} from '../state/types'
import {setRoundCache} from '../state/linechart/reducer'
import {useCurrentPool} from '../state/currentPool/hooks/useCurrentPool'

type LiquidityPool = {
  hourlySnapshots: Array<HourlySnapshots>
  dailySnapshots: Array<DailySnapshots>
}

type HourlySnapshots = {
  timestamp: number
  pool: {
    inputTokens: Array<InputTokens>
  }
  hourlyVolumeByTokenAmount: Array<any>
}

type DailySnapshots = {
  timestamp: number
  pool: {
    inputTokens: Array<InputTokens>
  }
  dailyVolumeByTokenAmount: Array<any>
}

type InputTokens = {
  id: string
  decimals: number
}

const RPC_URL = 'https://arb1.arbitrum.io/rpc'
const PRICE_FEED_MULTICALL_SIZE = 300
const INITIAL_ROUND_LIMIT = 300
const MULTICAL_CONTRACT_ADDRESS = '0xca11bde05977b3631167028862be2a173976ca11'

const TIME_INTERVALS = {
  '1h': 3600,
  '4h': 14400,
  '1d': 86400,
  '1w': 604800,
  '1m': 2592000,
  '3m': 7776000,
  '1y': 31536000
}

export const multicalAggregateABI = [
  {
    inputs: [
      {
        components: [
          {
            internalType: 'address',
            name: 'target',
            type: 'address'
          },
          {
            internalType: 'bytes',
            name: 'callData',
            type: 'bytes'
          }
        ],
        internalType: 'struct Multicall3.Call[]',
        name: 'calls',
        type: 'tuple[]'
      }
    ],
    name: 'aggregate',
    outputs: [
      {
        internalType: 'uint256',
        name: 'blockNumber',
        type: 'uint256'
      },
      {
        internalType: 'bytes[]',
        name: 'returnData',
        type: 'bytes[]'
      }
    ],
    stateMutability: 'payable',
    type: 'function'
  }
]

export const priceFeedContractAbi = [
  {
    inputs: [],
    name: 'latestRound',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint80', name: '_roundId', type: 'uint80' }],
    name: 'getRoundData',
    outputs: [
      { internalType: 'uint80', name: 'roundId', type: 'uint80' },
      { internalType: 'int256', name: 'answer', type: 'int256' },
      { internalType: 'uint256', name: 'startedAt', type: 'uint256' },
      { internalType: 'uint256', name: 'updatedAt', type: 'uint256' },
      { internalType: 'uint80', name: 'answeredInRound', type: 'uint80' }
    ],
    stateMutability: 'view',
    type: 'function'
  }
]

const calculateAverageTimePerRound = (data: PriceFeedData[]): number => {
  if (data.length < 2) {
    return 0
  } else {
    const totalDiff = data
      .slice(1)
      .reduce((sum, t, i) => sum + Math.abs(Number(t.updatedAt) - Number(data[i].updatedAt)), 0);
  
    const avgDiff = totalDiff / (data.length - 1);
    return avgDiff
  }

}

const calculateStepSize = (interval: string, averageTime: number): number => {
  const targetTimespan = TIME_INTERVALS[interval as keyof typeof TIME_INTERVALS]
  if (!targetTimespan || averageTime <= 0) return 1
  
  const totalRoundsNeeded = Math.ceil(targetTimespan / averageTime)
  const stepSize = Math.max(1, Math.ceil(totalRoundsNeeded / PRICE_FEED_MULTICALL_SIZE))
  
  return stepSize
}

export const useExchangeData = () => {
  const [avgRoundInSecond, setAvgRoundInSecond] = useState<number>(0)
  const { roundCache } = useSelector((state: State) => {
    return {
      roundCache: state.linechart.roundCache,
    }
  })
  const { chainId, ddlEngine, configs } = useConfigs()
  const {currentPool} = useCurrentPool()
  useEffect(()=>{
    console.log("#roundCache",roundCache)
  },[roundCache])
  const dispatch = useDispatch()
  // const [roundCache, setRoundCache] = useState<{[roundId: string]: PriceFeedData}>({})
  const getPairHourData = async ({
    interval,
    pair,
    baseToken
  }: {
    interval: LineChartIntervalType
    pair: string
    baseToken: string
  }) => {
    try {
      // @ts-ignore
      if (!configs.subGraph) {
        return []
      }
      // @ts-ignore
      const client = new GraphQLClient(configs.subGraph)
      const query = getQueryHourDatas(pair, interval)
      const res: { liquidityPool: LiquidityPool } = await client.request(query)
      const a = res.liquidityPool.hourlySnapshots
        ?.map((item) => {
          const [baseAmount, quoteAmount] =
            item.pool.inputTokens[0]?.id.toLowerCase() ===
            baseToken.toLowerCase()
              ? [
                  item.hourlyVolumeByTokenAmount[0],
                  item.hourlyVolumeByTokenAmount[1]
                ]
              : [
                  item.hourlyVolumeByTokenAmount[1],
                  item.hourlyVolumeByTokenAmount[0]
                ]
          const [baseDecimal, quoteDecimal] =
            item.pool.inputTokens[0]?.id.toLowerCase() ===
            baseToken.toLowerCase()
              ? [
                  item.pool.inputTokens[0]?.decimals,
                  item.pool.inputTokens[1]?.decimals
                ]
              : [
                  item.pool.inputTokens[1]?.decimals,
                  item.pool.inputTokens[0]?.decimals
                ]
          const baseConverted = parseFloat(
            ethers.utils.formatUnits(baseAmount, baseDecimal)
          )
          const quoteConverted = parseFloat(
            ethers.utils.formatUnits(quoteAmount, quoteDecimal)
          )
          const value = quoteConverted / baseConverted
          return {
            time: item.timestamp * 1000,
            value: formatFloat(value.toFixed(18))
          }
        })
        .sort((a, b) => a.time - b.time)
      return a
    } catch (error) {
      console.error(error)
      return []
    }
  }

  const getPairDayData = async ({
    interval,
    pair,
    baseToken
  }: {
    interval: LineChartIntervalType
    pair: string
    baseToken: string
  }) => {
    try {
      // @ts-ignore
      if (!configs.subGraph) {
        return []
      }
      // @ts-ignore
      const client = new GraphQLClient(configs.subGraph)
      const query = getQueryDayDatas(pair, interval)
      const res: { liquidityPool: LiquidityPool } = await client.request(query)
      return res.liquidityPool?.dailySnapshots
        .map((item) => {
          const [baseAmount, quoteAmount] =
            item.pool.inputTokens[0]?.id.toLowerCase() ===
            baseToken.toLowerCase()
              ? [
                  item.dailyVolumeByTokenAmount[0],
                  item.dailyVolumeByTokenAmount[1]
                ]
              : [
                  item.dailyVolumeByTokenAmount[1],
                  item.dailyVolumeByTokenAmount[0]
                ]
          const [baseDecimal, quoteDecimal] =
            item.pool.inputTokens[0]?.id.toLowerCase() ===
            baseToken.toLowerCase()
              ? [
                  item.pool.inputTokens[0]?.decimals,
                  item.pool.inputTokens[1]?.decimals
                ]
              : [
                  item.pool.inputTokens[1]?.decimals,
                  item.pool.inputTokens[0]?.decimals
                ]
          const baseConverted = parseFloat(
            ethers.utils.formatUnits(baseAmount, baseDecimal)
          )
          const quoteConverted = parseFloat(
            ethers.utils.formatUnits(quoteAmount, quoteDecimal)
          )
          const value = quoteConverted / baseConverted
          return {
            time: item.timestamp * 1000,
            value: formatFloat(value.toFixed(18))
          }
        })
        .sort((a, b) => a.time - b.time)
    } catch (error) {
      console.error(error)
      return []
    }
  }

  const chainLinkHistoricalPriceFeedDatas = async (
    action: 'PREV' | 'NEXT' | 'NONE' = 'NONE',
    from: string | BigNumber = BigNumber.from(0),
    feedAdress: string,
    interval: LineChartIntervalType
  ) => {
    try {
      if(!currentPool?.ORACLE) return [];
      console.log('Fetching historical price feed data...')

      const provider = new ethers.providers.JsonRpcProvider(RPC_URL)
      const priceFeedContract = new ethers.Contract(
        feedAdress,
        priceFeedContractAbi,
        provider
      )

      const latestRoundId = await priceFeedContract.latestRound()

      let roundId = BigNumber.from(0)
      let multiCallSize = 0

      if (action === 'PREV') {
        roundId = BigNumber.from(from)
        multiCallSize = PRICE_FEED_MULTICALL_SIZE
      } else if (action === 'NEXT') {
        if (BigNumber.from(latestRoundId).sub(from).gt(PRICE_FEED_MULTICALL_SIZE)) {
          roundId = BigNumber.from(from).add(PRICE_FEED_MULTICALL_SIZE)
          multiCallSize = PRICE_FEED_MULTICALL_SIZE
        } else {
          roundId = BigNumber.from(latestRoundId)
          multiCallSize = BigNumber.from(latestRoundId).sub(from).toNumber()
        }
      } else {
        roundId = BigNumber.from(latestRoundId)
        multiCallSize = PRICE_FEED_MULTICALL_SIZE
      }

      console.log(`Latest round ID: ${latestRoundId}`)

      const multicalContract = new ethers.Contract(
        MULTICAL_CONTRACT_ADDRESS,
        multicalAggregateABI,
        provider
      )

      const calls = []
      const roundsToFetch:any[] = []
      const priceFeedInterface = new Interface(priceFeedContractAbi)
      const totalRound = avgRoundInSecond == 0 ? 1 : Math.round((LINE_CHART_CONFIG[interval].range / 1000) / (avgRoundInSecond))
      const stepRound = avgRoundInSecond  === 0 ?
                          LINE_CHART_CONFIG[interval].stepRound : 
                          (Math.round(totalRound / INITIAL_ROUND_LIMIT) == 0 ? 1 : Math.round(totalRound / INITIAL_ROUND_LIMIT))
      console.log("#stepRound", stepRound)
      
      let currentRoundId = BigNumber.from(roundId)
      for (let i = 0; i < multiCallSize; i++) {
        const roundIdStr = currentRoundId.toString()
        
        // Check if this round is already cached
        if (!roundCache[encodeCLFeedCacheKey(feedAdress,roundIdStr)]) {
          calls.push({
            target: feedAdress,
            callData: priceFeedInterface.encodeFunctionData('getRoundData', [
              currentRoundId
            ])
          })
          roundsToFetch.push(currentRoundId.toString())
        }
        
        currentRoundId = currentRoundId.sub(stepRound)
      }

      console.log(`Found ${Object.keys(roundCache).length} cached rounds, fetching ${calls.length} new rounds`)

      let decodedData: PriceFeedData[] = []
      
      // Only make multicall if there are rounds to fetch
      let cache:PriceFeedDataCache = {}
      if (calls.length > 0) {
        const [, returnData] = await multicalContract.callStatic.aggregate(calls)

        decodedData = returnData
          .map((data: string) => {
            const decodedData = priceFeedInterface.decodeFunctionResult(
              'getRoundData',
              data
            )

            return {
              roundId: decodedData[0],
              answer: decodedData[1],
              startedAt: decodedData[2],
              updatedAt: decodedData[3],
              answeredInRound: decodedData[4]
            }
          })

        // Update cache with new data
        const newCacheEntries: {[key: string]: PriceFeedData} = {}
        decodedData.forEach((data, index) => {
          const roundIdStr = encodeCLFeedCacheKey(feedAdress, roundsToFetch[index])
          newCacheEntries[roundIdStr] = data
        })
        cache = {
          ...newCacheEntries,
          ...roundCache
        }
        dispatch(setRoundCache({
          cacheData: cache
        }))

        // setRoundCache(prevCache => ({
        //   ...prevCache,
        //   ...newCacheEntries
        // }))
        
        console.log(`Fetched ${decodedData.length} historical price feed data points.`)
      }

      // Combine cached and new data for the requested rounds
      const allRequestedData: PriceFeedData[] = []
      currentRoundId = BigNumber.from(roundId)
      
      for (let i = 0; i < multiCallSize; i++) {
        const roundIdStr = currentRoundId.toString()
        const cachedData = cache[encodeCLFeedCacheKey(feedAdress, roundIdStr)]
        allRequestedData.push(cachedData)
        currentRoundId = currentRoundId.sub(stepRound)
      }

      console.log("#allRequestedData", allRequestedData)
      
      // Calculate average time per round on initial load
      if (action === 'NONE' && avgRoundInSecond == 0 ) {
        const avgTime = calculateAverageTimePerRound(allRequestedData)
        setAvgRoundInSecond(avgTime)
        console.log(`Average time per round: ${avgTime} seconds`)
      }
      console.log(`##Avg: ${avgRoundInSecond}, Step ${stepRound}, totalRound: ${allRequestedData.length}, cached: ${Object.keys(roundCache).length}`)
      
      return allRequestedData
    } catch (error) {
      console.error('Error fetching historical price feed data:', error)
      return []
    }
  }

  const getLineChartData = async ({
    interval,
    pair,
    baseToken,
    action,
    from
  }: {
    interval: LineChartIntervalType
    pair: string
    baseToken: string
    action?: 'PREV' | 'NEXT' | 'NONE'
    from?: string | BigNumber
  }) => {
    // Calculate step size based on interval and average round time
    const stepSize = calculateStepSize(interval, avgRoundInSecond)
    console.log(`Step size for ${interval}: ${stepSize}`)

    return await chainLinkHistoricalPriceFeedDatas(action, from, pair, interval)
  }

  return {
    getLineChartData
  }
}

const getQueryDayDatas = (
  pair: string,
  interval: LineChartIntervalType
) => gql`{
  liquidityPool(id: "${pair}") {
    ${LINE_CHART_CONFIG[interval].type}(
      first: ${LINE_CHART_CONFIG[interval].limit},
      orderBy: timestamp,
      orderDirection: desc
    ) {
        dailyVolumeByTokenAmount
        timestamp
        pool {
          inputTokens {
            id,
            decimals
          }
        }
      }
    }
  }
`

const getQueryHourDatas = (
  pair: string,
  interval: LineChartIntervalType
) => gql`{
  liquidityPool(id: "${pair}") {
    ${LINE_CHART_CONFIG[interval].type}(
      first: ${LINE_CHART_CONFIG[interval].limit},
      orderBy: timestamp,
      orderDirection: desc) {
        hourlyVolumeByTokenAmount
        timestamp
        pool {
          inputTokens {
            id,
            decimals
          }
        }
      }
    }
  }
`