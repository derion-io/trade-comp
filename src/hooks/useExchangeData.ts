import { gql, GraphQLClient } from 'graphql-request'
import { useConfigs } from '../state/config/useConfigs'
import { BigNumber, ethers } from 'ethers'
import { formatFloat } from '../utils/helpers'
// eslint-disable-next-line no-unused-vars
import {
  CACHE_LATEST_ROUND_TIME,
  encodeCLFeedCacheKey,
  LINE_CHART_CONFIG,
  LineChartIntervalType
} from '../utils/lineChartConstant'
import { Interface } from 'ethers/lib/utils'
import {useEffect, useLayoutEffect, useState} from 'react'
import {LineChartData, PriceFeedData, PriceFeedDataCache} from '../state/linechart/type'
import {useDispatch, useSelector} from 'react-redux'
import {State} from '../state/types'
import {setLatestRoundCache, setPriceData} from '../state/linechart/reducer'
import {useCurrentPool} from '../state/currentPool/hooks/useCurrentPool'
import {chain, clone, cloneDeep} from 'lodash'
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

const calculateAverageTimePerRound = (data: LineChartData[],  stepRound:  number): number => {
  if (data.length < 2) {
    return 0
  } else {
    const totalDiff = data
      .slice(1)
      .reduce((sum, t, i) => sum + Math.abs(Number(t.updatedAt) - Number(data[i].updatedAt)), 0);
  
    const avgDiff = totalDiff / (data.length - 1);
    return (avgDiff /1000 )  / stepRound
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
  const [avgRoundInSecond, setAvgRoundInSecond] = useState<{[key:string]: number}>({})
  const { priceData, latestRoundCache} = useSelector((state: State) => {
    return {
      priceData: state.linechart.priceData,
      latestRoundCache: state.linechart.lastestRoundCache
    }
  })
  const { chainId, ddlEngine, configs } = useConfigs()
  const {currentPool} = useCurrentPool()
  useEffect(()=>{
    //console.log("#roundCache",roundCache)
  },[priceData])
  const dispatch = useDispatch()

  const chainLinkHistoricalPriceFeedDatas = async (
    action: 'PREV' | 'NEXT' | 'NONE' = 'NONE',
    from: string | BigNumber = BigNumber.from(0),
    feedAdress: string,
    interval: LineChartIntervalType,
    onUpdate?: (data: LineChartData[], preLoad: boolean) => void // callback for fresh data
  ) => {
    try {
      const chainIdStr= chainId.toString()
      // if((currentPool?.ORACLE || '').length == 0) return [];
      //console.log('Fetching historical price feed data...')
      const roundSecond = avgRoundInSecond[feedAdress] || 0
      const provider = new ethers.providers.JsonRpcProvider(RPC_URL)
      const priceFeedContract = new ethers.Contract(
        feedAdress,
        priceFeedContractAbi,
        provider
      )
      let latestRoundId = BigNumber.from(0)
      const now = Date.now()

      // if(latestRoundCache[feedAdress])  {
      //   latestRoundId = latestRoundCache[feedAdress].round
      // } 
      if(!latestRoundCache[feedAdress] || (now >= (latestRoundCache[feedAdress]?.cacheOutdateTime ||  0)))  {
        latestRoundId = await priceFeedContract.latestRound()
        dispatch(setLatestRoundCache({
          cacheData:  {
            ...latestRoundCache,
          [feedAdress]: {
            cacheOutdateTime: now + CACHE_LATEST_ROUND_TIME,
            cacheTime: now,
            round: latestRoundId
          }
          }
        }))
      } else {
        latestRoundId = latestRoundCache[feedAdress].round
      }
    
      let roundId = BigNumber.from(0)
      let multiCallSize = 0
      const totalRound = roundSecond === 0 ? LINE_CHART_CONFIG[interval].stepRound : Math.round((LINE_CHART_CONFIG[interval].range / 1000) / (roundSecond))
      const stepRound = roundSecond === 0 ?
                          LINE_CHART_CONFIG[interval].stepRound : 
                          (Math.round(totalRound / PRICE_FEED_MULTICALL_SIZE) == 0 ? 1 : Math.round(totalRound / PRICE_FEED_MULTICALL_SIZE) + 1)

      if (action === 'PREV') {
        roundId = BigNumber.from(from)
        multiCallSize = PRICE_FEED_MULTICALL_SIZE
      } else if (action === 'NEXT') {
        if (BigNumber.from(latestRoundId).sub(from).gt(PRICE_FEED_MULTICALL_SIZE * stepRound)) {
          roundId = BigNumber.from(from).add(PRICE_FEED_MULTICALL_SIZE * stepRound)
          multiCallSize = PRICE_FEED_MULTICALL_SIZE
        } else {
          roundId = BigNumber.from(latestRoundId)
          multiCallSize = PRICE_FEED_MULTICALL_SIZE
          // Math.round(BigNumber.from(latestRoundId).sub(from).toNumber() / stepRound)
        }
      } else {
        roundId = BigNumber.from(latestRoundId)
        multiCallSize = PRICE_FEED_MULTICALL_SIZE
      }

      //console.log(`Latest round ID: ${latestRoundId}`)

      const multicalContract = new ethers.Contract(
        MULTICAL_CONTRACT_ADDRESS,
        multicalAggregateABI,
        provider
      )

      const calls = []
      const roundsToFetch:string[] = []
      const priceFeedInterface = new Interface(priceFeedContractAbi)

      //console.log("#stepRound", stepRound)
      
      let currentRoundId = BigNumber.from(roundId)
      // --- Collect cached data first ---
      const datas: LineChartData[] = []
      for (let i = 0; i < multiCallSize; i++) {
        const roundIdStr = currentRoundId.toString()
        const cachedData = priceData?.[chainIdStr]?.[feedAdress]?.[roundIdStr]
        if (!cachedData?.updatedAt) {
          calls.push({
            target: feedAdress,
            callData: priceFeedInterface.encodeFunctionData('getRoundData', [
              currentRoundId
            ])
          })
          roundsToFetch.push(currentRoundId.toString())
        } else { 
          datas.push({...cachedData, value: ethers.utils.formatUnits(cachedData.answer, 8), roundId:currentRoundId })
        }
        currentRoundId = currentRoundId.sub(stepRound)
      }

      const hasCached = datas.some(Boolean)
      console.log("#updateData", datas ,priceData, feedAdress)
      console.log("#priceData", priceData)
      console.log("#feedAddres", feedAdress)
      console.log("#avgRoundInSecond", avgRoundInSecond)
      console.log("#roundstep", stepRound)

      if (hasCached && datas[0] ) {
        if (onUpdate) onUpdate(datas, true)
      }

      let decodedData: PriceFeedData[] = []
      const newPriceDatas: PriceFeedDataCache = cloneDeep(priceData)
      if(!newPriceDatas[chainIdStr]) {
          newPriceDatas[chainIdStr] = {}
      }
      if(!newPriceDatas[chainIdStr][feedAdress])
          newPriceDatas[chainIdStr][feedAdress] = {}
      if (calls.length > 0) {
        const [, returnData] = await multicalContract.callStatic.aggregate(calls)

        decodedData = returnData
          .map((data: string) => {
            const decodedData = priceFeedInterface.decodeFunctionResult(
              'getRoundData',
              data
            )

            return {
              // roundId: decodedData[0],
              answer: decodedData[1],
              // startedAt: decodedData[2],
              updatedAt: Number(decodedData[3]) * 1000,
              // answeredInRound: decodedData[4]
            }
          })

        console.log("#decodedData", decodedData)
        console.log("#newPriceDatas", newPriceDatas[chainIdStr],newPriceDatas[chainIdStr][feedAdress], newPriceDatas)
        // Update cache with new data
        const decodeDataWithObjects: {[key: string]: PriceFeedData} = {}
        
        decodedData.forEach((data, index) => {
          // const roundIdStr = encodeCLFeedCacheKey(feedAdress, roundsToFetch[index])
          // decodeDataWithObjects[roundsToFetch[index]] = data
          newPriceDatas[chainIdStr][feedAdress][roundsToFetch[index]] = data
        })
        dispatch(setPriceData({
          priceData: newPriceDatas
        }))
        // //console.log(`Fetched ${decodedData.length} historical price feed data points.`)
      }

      // --- Combine cached and new data for the requested rounds ---
      // (rebuild allRequestedData with updated cache)
      currentRoundId = BigNumber.from(roundId)
      const finalDatas: LineChartData[] = []
      // const roundCacheKeys = Object.keys(cache).filter(a => a.startsWith(feedAdress))
      // roundCacheKeys.map((key) => {
      //   const cachedData = cache[key]
      //   finalDatas.push(cachedData)
      // })
      for (let i = 0; i < multiCallSize; i++) {
        const roundIdStr = currentRoundId.toString()
        const cachedData = newPriceDatas[chainId][feedAdress]?.[roundIdStr]
        if(cachedData)  {
            finalDatas.push({...cachedData, value: ethers.utils.formatUnits(cachedData?.answer, 8), roundId: currentRoundId })
        }
        currentRoundId = currentRoundId.sub(stepRound)
      }
      
      // --- Notify chart with fresh data if callback provided ---
      if (onUpdate) onUpdate(finalDatas, false)

      // Calculate average time per round on initial load
      if (action === 'NONE' && roundSecond == 0 ) {
        const avgTime = calculateAverageTimePerRound(finalDatas, LINE_CHART_CONFIG[interval].stepRound)
        setAvgRoundInSecond((data => {
          return {
            ...data,
            ...{[feedAdress]: avgTime}
          }
        }))
        //console.log(`Average time per round: ${avgTime} seconds`)
      }
      //console.log(`##Avg: ${avgRoundInSecond}, Step ${stepRound}, totalRound: ${finalDatas.length}, cached: ${Object.keys(roundCache).length}`)
      
      // Return the freshest data
      return finalDatas
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
    from,
    onUpdate // pass through
  }: {
    interval: LineChartIntervalType
    pair: string
    baseToken: string
    action?: 'PREV' | 'NEXT' | 'NONE'
    from?: string | BigNumber
    onUpdate?: (data: LineChartData[], preLoad: boolean) => void // callback for fresh data
  }) => {
    // Calculate step size based on interval and average round time
    // const stepSize = calculateStepSize(interval, avgRoundInSecond[pair] || )
    //console.log(`Step size for ${interval}: ${stepSize}`)

    return await chainLinkHistoricalPriceFeedDatas(action, from, pair, interval, onUpdate)
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