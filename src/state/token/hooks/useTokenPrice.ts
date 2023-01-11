import { useConfigs } from '../../config/useConfigs'
import { useEffect, useState } from 'react'
import { bn, detectDecimalFromPrice, formatFloat, numberToWei, weiToNumber } from '../../../utils/helpers'
import { useCurrentPool } from '../../currentPool/hooks/useCurrentPool'
import { useContract } from '../../../hooks/useContract'
import { POOL_IDS } from '../../../utils/constant'
import { getPairInfo } from 'derivable-tools/dist/uniV2Pair'

export const useNativePrice = () => {
  const [price, setPrice] = useState<number>(0)
  const { configs, chainId } = useConfigs()
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        if (!configs.addresses.wrapUsdPair) {
          setPrice(0)
        }
        const res = await getPairInfo({
          pairAddress: configs.addresses.wrapUsdPair,
          chainId,
          rpcUrl: configs.rpcUrl
        })
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
  }, [configs, chainId])

  return price
}

export const useCpPrice = () => {
  const [price, setPrice] = useState<number>(0)
  const { configs } = useConfigs()
  const { getPoolContract } = useContract()
  const { poolAddress, cToken, states, cTokenPrice } = useCurrentPool()

  /**
   rDc = rDcNeutral + rDcLong + rDcShort
   rBC = rC - rDc
   CP.price = cToken.price * rBC / CP.totalSupply()
   */
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        if (!poolAddress || !cToken || !cTokenPrice || !states) {
          setPrice(0)
        }
        const contract = getPoolContract(poolAddress)
        const cpTotalSupply = await contract.totalSupply(POOL_IDS.cp)
        const rBc = states.Rc.sub(states.rDcNeutral).sub(states.rDcLong).sub(states.rDcShort)
        const p = bn(numberToWei(cTokenPrice)).mul(rBc).div(cpTotalSupply)
        const price = weiToNumber(p)

        setPrice(formatFloat(price, detectDecimalFromPrice(price)))
      } catch (e) {
        console.error(e)
        setPrice(0)
      }
    }
    fetchPrice()
  }, [configs, poolAddress, cToken, states, cTokenPrice])

  return price
}
