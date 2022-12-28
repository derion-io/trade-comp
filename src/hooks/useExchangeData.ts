import { gql, GraphQLClient } from 'graphql-request'
import { useConfigs } from '../state/config/useConfigs'
import { bn, detectDecimalFromPrice, formatFloat, numberToWei, weiToNumber } from '../utils/helpers'

type PairHourDataType = {
  reserve0: string,
  reserve1: string
  hourStartUnix: number
  pair: {
    token0: {
      id: string
    }
    token1: {
      id: string
    }
  }
}

type PairDayDataType = PairHourDataType & {
  dayStartUnix: number
}

export const useExchangeData = () => {
  const { configs } = useConfigs()

  const getLineChartData = async ({
    pair,
    baseToken
  }: {
    pair: string
    baseToken: string
  }) => {
    try {
      const client = new GraphQLClient(configs.theGraphExchange)
      const query = getQueryHourDatas(pair)
      console.log('query', query)
      const res: { pairHourDatas: PairHourDataType[] } = await client.request(query)
      console.log('res', res)
      const data = res.pairHourDatas?.map((item) => {
        const [baseReserve, quoteReserve] = item.pair.token0.id === baseToken
          ? [item.reserve0, item.reserve1]
          : [item.reserve1, item.reserve0]
        const value = weiToNumber(bn(numberToWei(quoteReserve, 36)).div(numberToWei(baseReserve, 18)))
        return {
          time: item.hourStartUnix,
          value: Number(formatFloat(value))
        }
      })
      console.log('data', data)

      return data
    } catch (error) {
      console.log('khanh error')
      console.error(error)
      return null
    }
  }

  return {
    getLineChartData
  }
}

const getQueryHourDatas = (pair: string) => gql`{
    pairHourDatas(
      first: 24
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
