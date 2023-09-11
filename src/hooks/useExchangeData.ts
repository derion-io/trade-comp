import { gql, GraphQLClient } from 'graphql-request'
import { useConfigs } from '../state/config/useConfigs'
import { ethers } from 'ethers'
import { formatFloat } from '../utils/helpers'
// eslint-disable-next-line no-unused-vars
import {
  LINE_CHART_CONFIG,
  LineChartIntervalType
} from '../utils/lineChartConstant'

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

export const useExchangeData = () => {
  const { configs } = useConfigs()

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
      if (!configs.theGraphMessari) {
        return []
      }
      const client = new GraphQLClient(configs.theGraphMessari)
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
      if (!configs.theGraphMessari) {
        return []
      }
      const client = new GraphQLClient(configs.theGraphMessari)
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

  const getLineChartData = async ({
    interval,
    pair,
    baseToken
  }: {
    interval: LineChartIntervalType
    pair: string
    baseToken: string
  }) => {
    return LINE_CHART_CONFIG[interval].type === 'hourlySnapshots'
      ? await getPairHourData({ interval, pair, baseToken })
      : await getPairDayData({ interval, pair, baseToken })
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
