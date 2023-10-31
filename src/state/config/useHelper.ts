import { useConfigs } from './useConfigs'
import { CHAINS, NATIVE_ADDRESS } from '../../utils/constant'
import BASE_TOKEN_ICON_LINKS from '../../assets/tokenIconLinks/base.json'
import { PoolType } from '../resources/type'
import { VALUE_IN_USD_STATUS } from '../setting/type'
import { useSettings } from '../setting/hooks/useSettings'
import { isErc1155Address } from '../../utils/helpers'
export const useHelper = () => {
  const { configs, chainId } = useConfigs()
  const { settings } = useSettings()

  const convertNativeAddressToWrapAddress = (address: string) => {
    if (!address) return address

    return address?.toLowerCase() === NATIVE_ADDRESS.toLowerCase()
      ? configs.wrappedTokenAddress
      : address
  }

  const wrapToNativeAddress = (address: string) => {
    if (!address) return address
    return address?.toLowerCase() === configs.wrappedTokenAddress.toLowerCase()
      ? NATIVE_ADDRESS
      : address
  }

  const getTokenIconUrl = async (address: string) => {
    const wAddress = convertNativeAddressToWrapAddress(address)
    const localWAddress = localStorage.getItem(wAddress)
    if (!wAddress || isErc1155Address(wAddress)) return ''
    if (localWAddress !== null) return localWAddress
    if (localWAddress === 'notfound') return ''
    const res = await getCoingeckoToken(configs.geckoTerminalSymbol, wAddress?.toLowerCase())
    if (res?.status === 'success') {
      localStorage.setItem(wAddress, res?.attributes?.image_url)
      return res?.attributes?.image_url || ''
    }
    if (res?.status === 'notfound') {
      localStorage.setItem(wAddress, 'notfound')
      return ''
    }
  }
  const getCoingeckoToken = async (chainSymbol: string, address: string) => {
    try {
      const res = await fetch(`https://api.geckoterminal.com/api/v2/networks/${chainSymbol}/tokens/${address.toLowerCase()}/info`)
      if (res.status === 404) return { status: 'notfound' }
      return { ...(await res.json()).data, status: 'success' }
    } catch (e) {
      return { status: 'error' }
    }
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
