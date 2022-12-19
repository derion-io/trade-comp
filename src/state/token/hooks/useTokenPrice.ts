import { useConfigs } from '../../config/useConfigs'
import { useEffect, useState } from 'react'
import { detectDecimalFromPrice, formatFloat, numberToWei, weiToNumber } from '../../../utils/helpers'
import { usePairInfo } from '../../../hooks/usePairInfo'

export const useNativePrice = () => {
  const [price, setPrice] = useState<number>(0)
  const { configs } = useConfigs()
  const { getPairInfo } = usePairInfo()
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        if (!configs.addresses.wrapUsdPair) {
          setPrice(0)
        }
        const res = await getPairInfo(configs.addresses.wrapUsdPair)
        const [wrapToken, usdToken] = res.token0.adr === configs.addresses.wrapToken ? [res.token0, res.token1] : [res.token1, res.token0]
        const priceWei = usdToken.reserve
          .mul(numberToWei(1))
          .div(wrapToken.reserve)
        const price = weiToNumber(priceWei, 18 + usdToken.decimals.toNumber() - wrapToken.decimals.toNumber())

        setPrice(formatFloat(price, detectDecimalFromPrice(price)))
      } catch (e) {
        console.error(e)
        setPrice(0)
      }
    }
    fetchPrice()
  }, [configs])

  return price
}
