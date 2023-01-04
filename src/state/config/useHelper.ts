import { useConfigs } from './useConfigs'
import { bn, div, formatPercent, numberToWei, sub, weiToNumber } from '../../utils/helpers'
import { MINI_SECOND_PER_DAY, POOL_IDS } from '../../utils/constant'
import { JsonRpcProvider } from '@ethersproject/providers'
import { useContract } from '../../hooks/useContract'
import { useListTokens } from '../token/hook'
import historyProvider from '../../lib/datafeed/historyProvider'

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

  const get24hChange = async (baseToken: string, cToken: string, quoteToken: string, currentPrice: string) => {
    try {
      const toTime = Math.floor((new Date().getTime() - MINI_SECOND_PER_DAY) / 1000)
      const result = await historyProvider.getBars({
        to: toTime,
        chainId: chainId,
        limit: 1,
        resolution: '1',
        route: `${baseToken}/${cToken}/${quoteToken}`
      })
      const beforePrice = result[0].open
      return formatPercent(
        div(
          sub(currentPrice, beforePrice),
          beforePrice
        )
      )
    } catch (e) {
      console.error(e)
      return 0
    }
  }

  const get24hChangeByLog = async (
    {
      baseToken,
      quoteToken,
      cToken,
      currentPrice,
      baseId,
      headBlock,
      range = 40
    }: {
      baseToken: string,
      cToken: string,
      quoteToken: string,
      currentPrice: string,
      baseId: number,
      headBlock?: number
      range?: number
    }): Promise<any> => {
    try {
      const provider = new JsonRpcProvider(configs.rpcToGetLogs)
      if (!headBlock) {
        headBlock = await provider.getBlockNumber()
      }
      const blocknumber24hAgo = headBlock - Math.floor(MINI_SECOND_PER_DAY / configs.timePerBlock)
      const eventInterface = getEventInterface()

      const { totalBaseReserve, totalQuoteReserve } = await provider.getLogs({
        address: cToken,
        fromBlock: blocknumber24hAgo - range,
        toBlock: blocknumber24hAgo,
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
      }).then((reserves) => {
        let totalBaseReserve = bn(0)
        let totalQuoteReserve = bn(0)
        for (const i in reserves) {
          totalBaseReserve = totalBaseReserve.add(reserves[i].baseReserve)
          totalQuoteReserve = totalQuoteReserve.add(reserves[i].quoteReserve)
        }
        return { totalBaseReserve, totalQuoteReserve }
      })

      if (totalBaseReserve.gt(0) && totalQuoteReserve.gt(0)) {
        const price = weiToNumber(
          totalQuoteReserve.mul(numberToWei(1)).div(totalBaseReserve),
          18 + (tokens[quoteToken]?.decimal || 18) - (tokens[baseToken]?.decimal || 18)
        )

        return formatPercent(
          div(
            sub(currentPrice, price),
            price
          )
        )
      } else {
        return await get24hChangeByLog({
          baseToken,
          quoteToken,
          cToken,
          currentPrice,
          baseId,
          headBlock,
          range: range * 2
        })
      }
    } catch (e) {
      console.error(e)
      return 0
    }
  }

  return { get24hChangeByLog, get24hChange, convertNativeAddressToWrapAddress, getTokenIconUrl }
}
