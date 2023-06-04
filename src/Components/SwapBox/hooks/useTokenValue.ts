import { useMemo } from 'react'
import {
  bn, cutDecimal,
  decodeErc1155Address,
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
  amount?: string,
  tokenAddress?: string
}) => {
  const { prices } = useTokenPrice()
  const { configs } = useConfigs()
  const { tokens } = useListTokens()
  const { pools } = useListPool()
  const { convertNativeAddressToWrapAddress } = useHelper()

  const getTokenValue = (_tokenAddress: string, _amount: string) => {
    let value = '0'
    const address = convertNativeAddressToWrapAddress(_tokenAddress)

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

        value = weiToNumber(
          bn(numberToWei(_amount)).mul(numberToWei(tokenPrice))
          , 54)
      }
    } else {
      const tokenPrice = prices[address] && prices[address].gt(0) ? parseSqrtX96(
        prices[address]?.mul(numberToWei(1, 9)) || bn(0),
        tokens[address] || {},
        tokens[configs.stableCoins[0]] || {}
      ) : numberToWei(1, 36)

      value = weiToNumber(
        bn(numberToWei(_amount)).mul(numberToWei(tokenPrice))
        , 54)
    }
    return cutDecimal(value, 18)
  }

  const value = useMemo(() => {
    if (!amount || !tokenAddress) return 0
    return getTokenValue(tokenAddress, amount)
  }, [amount, tokenAddress, prices])

  return {
    value,
    getTokenValue
  }
}
