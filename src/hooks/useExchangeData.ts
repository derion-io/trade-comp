import { gql, GraphQLClient } from 'graphql-request'
import { useConfigs } from '../state/config/useConfigs'
import { ethers } from 'ethers'
import { bn, formatFloat, numberToWei, weiToNumber } from '../utils/helpers'
// eslint-disable-next-line no-unused-vars
import { LINE_CHART_CONFIG, LINE_CHART_ARBI_CONFIG, LineChartIntervalType } from '../utils/lineChartConstant'

type PairHourDataType = {
  reserve0: string,
  reserve1: string
  hourStartUnix: number
  dayStartUnix: number
  date: number
  pair: {
    token0: {
      id: string
    }
    token1: {
      id: string
    }
  }
}

type LiquidityPool = {
  hourlySnapshots: Array<HourlySnapshots>,
  dailySnapshots: Array<DailySnapshots>,
}

type HourlySnapshots = {
  timestamp: number
  pool: {
    inputTokens: Array<InputTokens>
  },
  hourlyVolumeByTokenAmount: Array<any>
}

type DailySnapshots = {
  timestamp: number
  pool: {
    inputTokens: Array<InputTokens>
  },
  dailyVolumeByTokenAmount: Array<any>
}

type InputTokens = {
  id: string,
  decimals: number
}

type PairDayDataType = {
  reserve0: string,
  reserve1: string
  date: number
  token0: {
    id: string
  }
  token1: {
    id: string
  }
}

export const useExchangeData = () => {
  const { configs } = useConfigs()

  const getArbitrumPairHourData = async ({
    interval,
    pair,
    baseToken
  }: {
    interval: LineChartIntervalType,
    pair: string
    baseToken: string
  }) => {
    try {
      if (!configs.theGraphArbitrum) {
        return []
      }
      const client = new GraphQLClient(configs.theGraphArbitrum)
      const query = getQueryArbitrumHourDatas(pair, interval)
      const res: { liquidityPool: LiquidityPool} = await client.request(query)
      const a = res.liquidityPool.hourlySnapshots?.map((item) => {
        const [baseAmount, quoteAmount] = item.pool.inputTokens[0]?.id.toLowerCase() === baseToken.toLowerCase()
          ? [item.hourlyVolumeByTokenAmount[0], item.hourlyVolumeByTokenAmount[1]]
          : [item.hourlyVolumeByTokenAmount[1], item.hourlyVolumeByTokenAmount[0]]
        const [baseDecimal, quoteDecimal] = item.pool.inputTokens[0]?.id.toLowerCase() === baseToken.toLowerCase()
          ? [item.pool.inputTokens[0]?.decimals, item.pool.inputTokens[1]?.decimals]
          : [item.pool.inputTokens[1]?.decimals, item.pool.inputTokens[0]?.decimals]
        const baseConverted = parseFloat(ethers.utils.formatUnits(baseAmount, baseDecimal))
        const quoteConverted = parseFloat(ethers.utils.formatUnits(quoteAmount, quoteDecimal))
        const value = quoteConverted / baseConverted
        return {
          time: item.timestamp * 1000,
          value: formatFloat(value.toFixed(18))
        }
      }).sort((a, b) => a.time - b.time)
      return a
    } catch (error) {
      console.error(error)
      return []
    }
  }

  const getPairHourData = async ({
    chainId,
    interval,
    pair,
    baseToken
  }: {
    chainId: number,
    interval: LineChartIntervalType,
    pair: string
    baseToken: string
  }) => {
    if (chainId === 42161) {
      return getArbitrumPairHourData({
        interval,
        pair,
        baseToken
      })
    }
    try {
      if (!configs.theGraphExchange) {
        return []
      }
      const client = new GraphQLClient(configs.theGraphExchange)
      const query = getQueryHourDatas(pair, interval)
      const res: { pairHourDatas: PairHourDataType[]} = await client.request(query)
      return res.pairHourDatas?.map((item) => {
        const [baseReserve, quoteReserve] = item.pair.token0.id.toLowerCase() === baseToken.toLowerCase()
          ? [item.reserve0, item.reserve1]
          : [item.reserve1, item.reserve0]
        const value = weiToNumber(bn(numberToWei(quoteReserve, 36)).div(numberToWei(baseReserve, 18)))
        return {
          time: item.hourStartUnix * 1000,
          value: Number(formatFloat(value))
        }
      }).sort((a, b) => a.time - b.time)
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
    interval: LineChartIntervalType,
    pair: string
    baseToken: string
  }) => {
    try {
      if (!configs.theGraphArbitrum) {
        return []
      }
      const client = new GraphQLClient(configs.theGraphArbitrum)
      const query = getQueryArbitrumDayDatas(pair, interval)
      const res: { liquidityPool: LiquidityPool} = await client.request(query)
      return res.liquidityPool?.dailySnapshots.map((item) => {
        const [baseAmount, quoteAmount] = item.pool.inputTokens[0]?.id.toLowerCase() === baseToken.toLowerCase()
          ? [item.dailyVolumeByTokenAmount[0], item.dailyVolumeByTokenAmount[1]]
          : [item.dailyVolumeByTokenAmount[1], item.dailyVolumeByTokenAmount[0]]
        const [baseDecimal, quoteDecimal] = item.pool.inputTokens[0]?.id.toLowerCase() === baseToken.toLowerCase()
          ? [item.pool.inputTokens[0]?.decimals, item.pool.inputTokens[1]?.decimals]
          : [item.pool.inputTokens[1]?.decimals, item.pool.inputTokens[0]?.decimals]
        const baseConverted = parseFloat(ethers.utils.formatUnits(baseAmount, baseDecimal))
        const quoteConverted = parseFloat(ethers.utils.formatUnits(quoteAmount, quoteDecimal))
        const value = quoteConverted / baseConverted
        return {
          time: item.timestamp * 1000,
          value: formatFloat(value.toFixed(18))
        }
      }).sort((a, b) => a.time - b.time)
    } catch (error) {
      console.error(error)
      return []
    }
  }

  const getLineChartData = async ({
    chainId,
    interval,
    pair,
    baseToken
  }: {
    chainId: number,
    interval: LineChartIntervalType,
    pair: string
    baseToken: string
  }) => {
    return LINE_CHART_ARBI_CONFIG[interval].type === 'hourlySnapshots'
      ? await getPairHourData({ interval, pair, baseToken, chainId })
      : await getPairDayData({ interval, pair, baseToken })
  }

  return {
    getLineChartData
  }
}

const getQueryArbitrumDayDatas = (pair: string, interval: LineChartIntervalType) => gql`{
  liquidityPool(id: "${pair}") {
    ${LINE_CHART_ARBI_CONFIG[interval].type}(
      first: ${LINE_CHART_ARBI_CONFIG[interval].limit},
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

const getQueryArbitrumHourDatas = (pair: string, interval: LineChartIntervalType) => gql`{
  liquidityPool(id: "${pair}") {
    ${LINE_CHART_ARBI_CONFIG[interval].type}(
      first: ${LINE_CHART_ARBI_CONFIG[interval].limit},
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

const getQueryHourDatas = (pair: string, interval: LineChartIntervalType) => gql`{
    ${LINE_CHART_CONFIG[interval].type}(
      first: ${LINE_CHART_CONFIG[interval].limit}
      where: {pair: "${pair}"}
      orderBy: hourStartUnix
      orderDirection: desc
    ) {
      hourStartUnix,
      id
      reserve0
      reserve1
      pair {
        token0 {
          id
        }
        token1 {
          id
        }
      }
    }
  }
`
