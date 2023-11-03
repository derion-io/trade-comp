import { parseSqrtX96 } from 'derivable-tools/dist/utils/helper'
import { useConfigs } from '../state/config/useConfigs'
import { useTokenPrice } from '../state/resources/hooks/useTokenPrice'
import { bn } from '../utils/helpers'
import { useListTokens } from '../state/token/hook'

export const useNativePrice = () => {
  const { configs } = useConfigs()
  const { prices } = useTokenPrice()
  const { tokens } = useListTokens()
  if (prices[configs.wrappedTokenAddress] && tokens[configs.wrappedTokenAddress] && prices[configs.wrappedTokenAddress].gte(0)) {
    const wrappedTokenValue = parseSqrtX96(
      prices[configs.wrappedTokenAddress] || bn(0),
      tokens[configs.wrappedTokenAddress] || {},
      tokens[configs.stablecoins[0]] || {}
    )
    return { data: wrappedTokenValue }
  }
  return { data: configs.nativePriceUSD ?? 1600 }
}
