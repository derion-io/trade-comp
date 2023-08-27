import { useConfigs } from './useConfigs'
import { CHAINS, NATIVE_ADDRESS } from '../../utils/constant'
import BASE_TOKEN_ICON_LINKS from '../../assets/tokenIconLinks/base.json'

export const useHelper = () => {
  const { configs, chainId } = useConfigs()

  const convertNativeAddressToWrapAddress = (address: string) => {
    if (!address) return address

    return address?.toLowerCase() === configs.addresses?.nativeToken?.toLowerCase()
      ? configs.addresses?.wrapToken
      : address
  }

  const wrapToNativeAddress = (address: string) => {
    if (!address) return address
    return address?.toLowerCase() === configs.addresses?.wrapToken?.toLowerCase()
      ? NATIVE_ADDRESS
      : address
  }

  const getTokenIconUrl = (address: string) => {
    if (chainId === CHAINS.BASE) {
      return BASE_TOKEN_ICON_LINKS[convertNativeAddressToWrapAddress(address || '')?.toLowerCase()]
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

  return { wrapToNativeAddress, convertNativeAddressToWrapAddress, getTokenIconUrl }
}
