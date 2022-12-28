import { request, gql, GraphQLClient } from 'graphql-request'
import { useConfigs } from '../state/config/useConfigs'

export const useExchangeData = () => {
  const { configs } = useConfigs()

  const getLineChartData = async ({
    where = {},
    first = 1000,
    orderBy = 'id',
    orderDirection = 'desc',
    skip = 0
  }: {
      where?: any,
      first?: number,
      orderBy?: string,
      orderDirection?: 'asc' | 'desc',
      skip?: number,
    }) => {
    try {
      const client = new GraphQLClient(configs.theGraphExchange)
      const query = gql`{
          pairHourDatas(
            first: 24
            where: {pair: "0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16"}
            orderBy: hourStartUnix
            orderDirection: desc
          ) {
            hourStartUnix,
            id
            reserve0
            reserve1
          }
        }
      `
      const res = await client.request(query)
      console.log('khanh', res)

      return res.nfts
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
