import { useConfigs } from './useConfigs'
import { CHAINS, NATIVE_ADDRESS } from '../../utils/constant'
import BASE_TOKEN_ICON_LINKS from '../../assets/tokenIconLinks/base.json'
import { PoolType } from '../resources/type'
import { VALUE_IN_USD_STATUS } from '../setting/type'
import { useSettings } from '../setting/hooks/useSettings'

export const useHelper = () => {
  const { configs, chainId } = useConfigs()
  const { settings } = useSettings()

  const convertNativeAddressToWrapAddress = (address: string) => {
    if (!address) return address

    return address?.toLowerCase() ===
      NATIVE_ADDRESS.toLowerCase()
      ? configs.wrappedTokenAddress
      : address
  }

  const wrapToNativeAddress = (address: string) => {
    if (!address) return address
    return address?.toLowerCase() ===
      configs.wrappedTokenAddress.toLowerCase()
      ? NATIVE_ADDRESS
      : address
  }

  const getTokenIconUrl = (address: string) => {
    if (chainId === CHAINS.BASE) {
      return BASE_TOKEN_ICON_LINKS[
        convertNativeAddressToWrapAddress(address || '')?.toLowerCase()
      ]
    }
    if (chainId === CHAINS.ARBITRUM) {
      return `https://cdn.arken.finance/token/arbitrum/${convertNativeAddressToWrapAddress(
        address || ''
      )?.toLowerCase()}.png`
    }
    return `https://farm.army/bsc/token/${convertNativeAddressToWrapAddress(
      address || ''
    )?.toLowerCase()}.webp`
  }

  const isShowValueInUsd = (pool: PoolType) => {
    return (
      settings.showValueInUsd === VALUE_IN_USD_STATUS.USD ||
      (settings.showValueInUsd === VALUE_IN_USD_STATUS.AUTO &&
        pool?.baseToken === pool?.TOKEN_R)
    )
  }

  return {
    wrapToNativeAddress,
    convertNativeAddressToWrapAddress,
    getTokenIconUrl,
    isShowValueInUsd
  }
}
