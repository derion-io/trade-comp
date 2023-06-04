import { useMemo } from 'react'
import {
  bn,
  decodeErc1155Address,
  formatFloat,
  isErc1155Address,
  numberToWei,
  weiToNumber
} from '../../../utils/helpers'
import { useTokenPrice } from '../../../state/resources/hooks/useTokenPrice'
import { parseSqrtX96 } from 'derivable-tools/dist/utils/helper'
import { useConfigs } from '../../../state/config/useConfigs'
import { useListTokens } from '../../../state/token/hook'
import { useHelper } from '../../../state/config/useHelper'
import { POOL_IDS } from '../../../utils/constant'
import { useListPool } from '../../../state/resources/hooks/useListPool'

export const useTokenValue = ({
  amount,
  tokenAddress
}: {
  amount: string,
  tokenAddress: string
}) => {
  const { prices } = useTokenPrice()
  const { configs } = useConfigs()
  const { tokens } = useListTokens()
  const { pools } = useListPool()
  const { convertNativeAddressToWrapAddress } = useHelper()

  return useMemo(() => {
    let value = 0
    const address = convertNativeAddressToWrapAddress(tokenAddress)

    if (isErc1155Address(address)) {
      const { address: poolAddress, id } = decodeErc1155Address(address)
      const pool = pools[poolAddress]
      if (pool && pool.states) {
        const rX = Number(id) === POOL_IDS.A
          ? pool.states.rA
          : Number(id) === POOL_IDS.B ? pool.states.rB : pool.states.rB

        const sX = Number(id) === POOL_IDS.A
          ? pool.states.sA
          : Number(id) === POOL_IDS.B ? pool.states.sB : pool.states.sB

        const tokenPrice = parseSqrtX96(
          prices[pool.TOKEN_R]?.mul(rX)?.div(sX).mul(numberToWei(1, 9)) || bn(0),
          tokens[address] || {},
          tokens[configs.stableCoins[0]] || {}
        )

        value = formatFloat(weiToNumber(
          bn(numberToWei(amount)).mul(numberToWei(tokenPrice))
          , 54), 2)
      }
    } else {
      const tokenPrice = parseSqrtX96(
        prices[address]?.mul(numberToWei(1, 9)) || bn(0),
        tokens[address] || {},
        tokens[configs.stableCoins[0]] || {}
      )

      value = formatFloat(weiToNumber(
        bn(numberToWei(amount)).mul(numberToWei(tokenPrice))
        , 54), 2)
    }
    return value
  }, [amount, tokenAddress, prices])
}
