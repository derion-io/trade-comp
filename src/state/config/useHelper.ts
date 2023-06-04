import { useConfigs } from './useConfigs'
import { NATIVE_ADDRESS } from '../../utils/constant'

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
    if (chainId === 42161) {
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
