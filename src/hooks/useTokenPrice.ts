import { parseSqrtX96 } from 'derivable-tools/dist/utils/helper'
import { useConfigs } from '../state/config/useConfigs'
import { useTokenPrice } from '../state/resources/hooks/useTokenPrice'
import { NUM, bn } from '../utils/helpers'
import { useListTokens } from '../state/token/hook'

export const useNativePrice = () => {
  const { configs } = useConfigs()
  const { prices } = useTokenPrice()
  const { tokens } = useListTokens()
  if (prices[configs.wrappedTokenAddress] && tokens[configs.wrappedTokenAddress] && Number(prices[configs.wrappedTokenAddress]) > 0) {
    const wrappedTokenValue = prices[configs.wrappedTokenAddress]
    return { data: NUM(wrappedTokenValue) }
  }
  return { data: configs.nativePriceUSD ?? 1600 }
}
