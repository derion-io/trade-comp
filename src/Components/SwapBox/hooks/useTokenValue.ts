import { useMemo } from 'react'
import {
  bn,
  cutDecimal,
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
import { useResource } from '../../../state/resources/hooks/useResource'
import { useSettings } from '../../../state/setting/hooks/useSettings'

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
  const { pools } = useResource()
  const { convertNativeAddressToWrapAddress } = useHelper()
  const { settings } = useSettings()
  const { isShowValueInUsd } = useHelper()

  const getTokenValue = (_tokenAddress: string, _amount: string) => {
    let value = '0'
    const address = convertNativeAddressToWrapAddress(_tokenAddress)
    if (!prices || !pools) return value

    if (isErc1155Address(address)) {
      const { address: poolAddress, id } = decodeErc1155Address(address)
      const pool = pools[poolAddress]
      if (pool && pool.states) {
        const rX = Number(id) === POOL_IDS.A
          ? pool.states.rA
          : Number(id) === POOL_IDS.B ? pool.states.rB : pool.states.rC

        const sX = Number(id) === POOL_IDS.A
          ? pool.states.sA
          : Number(id) === POOL_IDS.B ? pool.states.sB : pool.states.sC

        // TOTO: need remove mul(numberToWei(1, 9) after fix parseSqrtX96 function
        const tokenPrice = prices[pool.TOKEN_R] && prices[pool.TOKEN_R].gt(0) && isShowValueInUsd(pool)
          ? parseSqrtX96(
            prices[pool.TOKEN_R]?.mul(numberToWei(1, 9)) || bn(0),
            tokens[pool.TOKEN_R] || {},
            tokens[configs.stableCoins[0]] || {}
          )
          : numberToWei(1, 18)

        value = weiToNumber(
          bn(numberToWei(_amount)).mul(numberToWei(tokenPrice)).mul(rX).div(sX)
          , 54)
      }
    } else {
      // TOTO: need remove mul(numberToWei(1, 9) after fix parseSqrtX96 function
      const tokenPrice = prices[address] && prices[address].gt(0) && isShowValueInUsd(null) ? parseSqrtX96(
        prices[address]?.mul(numberToWei(1, 9)) || bn(0),
        tokens[address] || {},
        tokens[configs.stableCoins[0]] || {}
      ) : numberToWei(1, 18)

      value = weiToNumber(
        bn(numberToWei(_amount)).mul(numberToWei(tokenPrice))
        , 54)
    }
    value = cutDecimal(value, 18)
    if (value == null || Number.isNaN(value)) {
      return '0'
    }
    return value
  }

  const value = useMemo(() => {
    if (!amount || !tokenAddress) return '0'
    return getTokenValue(tokenAddress, amount)
  }, [amount, tokenAddress, prices, settings.showValueInUsd])

  return {
    value,
    getTokenValue
  }
}
