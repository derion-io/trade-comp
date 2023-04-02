import { gql, GraphQLClient } from 'graphql-request'
import { useConfigs } from '../state/config/useConfigs'
import { bn, formatFloat, numberToWei, weiToNumber } from '../utils/helpers'
import { LINE_CHART_CONFIG, LineChartIntervalType } from '../utils/lineChartConstant'

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
      const client = new GraphQLClient(configs.theGraphExchange)
      const query = getQueryArbitrumHourDatas(pair, interval)
      const res: { pairHourDatas: PairHourDataType[]} = await client.request(query)
      const a = res.pairHourDatas?.map((item) => {
        const [baseReserve, quoteReserve] = item.pair.token0.id.toLowerCase() === baseToken.toLowerCase()
          ? [item.reserve0, item.reserve1]
          : [item.reserve1, item.reserve0]
        const value = weiToNumber(bn(numberToWei(quoteReserve, 36)).div(numberToWei(baseReserve, 18)))
        return {
          time: item.date * 1000,
          value: Number(formatFloat(value))
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
      const client = new GraphQLClient(configs.theGraphExchange)
      const query = getQueryDayDatas(pair, interval)
      const res: { pairDayDatas: PairDayDataType[]} = await client.request(query)
      return res.pairDayDatas?.map((item) => {
        const [baseReserve, quoteReserve] = item.token0.id === baseToken
          ? [item.reserve0, item.reserve1]
          : [item.reserve1, item.reserve0]
        const value = weiToNumber(bn(numberToWei(quoteReserve, 36)).div(numberToWei(baseReserve, 18)))
        return {
          time: item.date * 1000,
          value: Number(formatFloat(value))
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
    return LINE_CHART_CONFIG[interval].type === 'pairHourDatas'
      ? await getPairHourData({ interval, pair, baseToken, chainId })
      : await getPairDayData({ interval, pair, baseToken })
  }

  return {
    getLineChartData
  }
}

const getQueryDayDatas = (pair: string, interval: LineChartIntervalType) => gql`{
    ${LINE_CHART_CONFIG[interval].type}(
      first: ${LINE_CHART_CONFIG[interval].limit}
      where: {pair: "${pair}"}
      orderBy: date
      orderDirection: desc
    ) {
      date
      id
      reserve0
      reserve1
      token0 {
        id
      }
      token1 {
        id
      }
    }
  }
`

const getQueryArbitrumHourDatas = (pair: string, interval: LineChartIntervalType) => gql`{
    ${LINE_CHART_CONFIG[interval].type}(
      first: ${LINE_CHART_CONFIG[interval].limit}
      where: {pair: "${pair}"}
      orderBy: date
      orderDirection: desc
    ) {
      date,
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
