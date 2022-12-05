import { useConfigs } from './useConfigs'
import { div, formatPercent, numberToWei, sub, weiToNumber } from '../../utils/helpers'
import { CHART_API_ENDPOINT, POOL_IDS } from '../../utils/constant'
import { JsonRpcProvider } from '@ethersproject/providers'
import { useContract } from '../../hooks/useContract'
import { useListTokens } from '../token/hook'

export const useHelper = () => {
  const { tokens } = useListTokens()
  const { configs, chainId } = useConfigs()
  const { getEventInterface } = useContract()

  const convertNativeAddressToWrapAddress = (address: string) => {
    if (!address) return address

    return address?.toLowerCase() === configs.addresses?.nativeToken?.toLowerCase()
      ? configs.addresses?.wrapToken
      : address
  }

  const getTokenIconUrl = (address: string) => {
    if (chainId === 42161) {
      return `https://cdn.arken.finance/token/arbitrum/${convertNativeAddressToWrapAddress(
        address || ''
      )?.toLowerCase()}.png`
    }
    return `https://farm.army/bsc/token/${convertNativeAddressToWrapAddress(
      address || ''
    )?.toLowerCase()}.webp`
  }

  const get24hChange = async (baseToken: string, cToken: string, quoteToken: string) => {
    const toTime = Math.floor(new Date().getTime() / 1000)
    const query = `${baseToken},${cToken},${quoteToken}`
    const result = await fetch(`${CHART_API_ENDPOINT}candleline4?q=${query}&r=1H&l=24&t=${toTime}`)
      .then((r) => r.json())
      .then((res: any) => {
        const open = res.o[0]
        const close = res.c[res.o?.length - 1]
        console.log({
          open, close
        })
        return formatPercent(
          div(
            sub(close, open),
            open
          )
        )
      })
      .catch((err: any) => {
        console.error(err)
        return 0
      })

    return Number(result)
  }

  const get24hChangeByLog = async (
    {
      baseToken,
      quoteToken,
      cToken,
      currentPrice,
      baseId
    }: {
      baseToken: string,
      cToken: string,
      quoteToken: string,
      currentPrice: string,
      baseId: number
    }) => {
    try {
      const provider = new JsonRpcProvider(configs.rpcToGetLogs)
      const headBlock = await provider.getBlockNumber()
      const blocknumber24hAgo = headBlock - Math.floor(8640000 / configs.timePerBlock)
      const eventInterface = getEventInterface()

      const reserves = await provider.getLogs({
        address: cToken,
        fromBlock: blocknumber24hAgo - 20,
        toBlock: blocknumber24hAgo + 20,
        topics: [
          '0x1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1'
        ]
      }).then((logs) => {
        return logs.map((log) => {
          const data = eventInterface.parseLog(log)
          const [baseReserve, quoteReserve] = baseId === POOL_IDS.token0
            ? [data.args.reserve0, data.args.reserve1]
            : [data.args.reserve1, data.args.reserve0]
          return {
            baseReserve,
            quoteReserve
          }
        })
      })

      const { baseReserve, quoteReserve } = reserves[0]
      const price = weiToNumber(
        quoteReserve.mul(numberToWei(1)).div(baseReserve),
        18 + (tokens[quoteToken]?.decimal || 18) - (tokens[baseToken]?.decimal || 18)
      )

      return formatPercent(
        div(
          sub(currentPrice, price),
          price
        )
      )
    } catch (e) {
      console.error(e)
      return 0
    }
  }

  return { get24hChangeByLog, get24hChange, convertNativeAddressToWrapAddress, getTokenIconUrl }
}
