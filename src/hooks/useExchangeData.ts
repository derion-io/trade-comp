import { gql, GraphQLClient } from 'graphql-request'
import { useConfigs } from '../state/config/useConfigs'
import { BigNumber, ethers } from 'ethers'
import { formatFloat } from '../utils/helpers'
// eslint-disable-next-line no-unused-vars
import {
  LINE_CHART_CONFIG,
  LineChartIntervalType
} from '../utils/lineChartConstant'
import { Interface } from 'ethers/lib/utils'
import {useState} from 'react'

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

type PriceFeedData = {
  roundId: BigNumber
  answer: BigNumber
  startedAt: BigNumber
  updatedAt: BigNumber
  answeredInRound: BigNumber
  time?: number
}

const RPC_URL = 'https://arb1.arbitrum.io/rpc'
const PRICE_FEED_CONTRACT_ADDRESS = '0x6ce185860a4963106506C203335A2910413708e9'
const PRICE_FEED_MULTICALL_SIZE = 5000
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

export const useExchangeData = () => {
  const { configs } = useConfigs()
  const [avgRoundInSecond, setAvgRoundInSecond] = useState<number>(0)

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

  const calculateAverageTimePerRound = (data: PriceFeedData[]): number => {
    if (data.length < 2) return 0
    
    const validData = data
      .filter(item => item.updatedAt && item.updatedAt.gt(0))
      .sort((a, b) => a.updatedAt.toNumber() - b.updatedAt.toNumber())
    
    if (validData.length < 2) return 0
    
    let totalTimeDiff = 0
    let validDiffs = 0
    
    for (let i = 1; i < validData.length; i++) {
      const timeDiff = validData[i].updatedAt.toNumber() - validData[i-1].updatedAt.toNumber()
      if (timeDiff > 0 && timeDiff < 86400) { // Filter out unrealistic time differences (> 1 day)
        totalTimeDiff += timeDiff
        validDiffs++
      }
    }
    
    const average = validDiffs > 0 ? totalTimeDiff / validDiffs : 0
    console.log(`Calculated average time per round: ${average} seconds`)
    return average
  }

  const calculateStepSize = (interval: string, averageTime: number): number => {

    const targetTimespan = TIME_INTERVALS[interval as keyof typeof TIME_INTERVALS]
    if (!targetTimespan || averageTime <= 0) return 1
    
    const totalRoundsNeeded = Math.ceil(targetTimespan / averageTime)
    const stepSize = Math.max(1, Math.ceil(totalRoundsNeeded / PRICE_FEED_MULTICALL_SIZE))
    
    console.log(`For ${interval}: target=${targetTimespan}s, avgTime=${averageTime}s, totalRounds=${totalRoundsNeeded}, step=${stepSize}`)
    return stepSize
  }

  const chainLinkHistoricalPriceFeedDatas = async (
    action: 'PREV' | 'NEXT' | 'NONE' = 'NONE',
    from: string | BigNumber = BigNumber.from(0)
  ) => {
    try {
      console.log('Fetching historical price feed data...')

      const provider = new ethers.providers.JsonRpcProvider(RPC_URL)
      const priceFeedContract = new ethers.Contract(
        PRICE_FEED_CONTRACT_ADDRESS,
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
      const priceFeedInterface = new Interface(priceFeedContractAbi)

      for (let i = 0; i < multiCallSize; i++) {
        calls.push({
          target: PRICE_FEED_CONTRACT_ADDRESS,
          callData: priceFeedInterface.encodeFunctionData('getRoundData', [
            BigNumber.from(roundId)
          ])
        })

        roundId = BigNumber.from(roundId).sub(1)
      }

      const [, returnData] = await multicalContract.callStatic.aggregate(calls)

      const decodedData = returnData
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
        .sort((a: any, b: any) => a.time - b.time)
      
      console.log(`Fetched ${decodedData.length} historical price feed data points.`)
      console.log(decodedData.slice(0, 100))
      return decodedData
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
    // return LINE_CHART_CONFIG[interval].type === 'hourlySnapshots'
    //   ? await getPairHourData({ interval, pair, baseToken })
    //   : await getPairDayData({ interval, pair, baseToken })

    return await chainLinkHistoricalPriceFeedDatas(action, from)
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
