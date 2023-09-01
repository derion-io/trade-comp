import { useDispatch, useSelector } from 'react-redux'
import { State } from '../../types'
import { useListTokens } from '../../token/hook'
import { useEffect } from 'react'
import { addTokenPriceWithChain } from '../reducer'
import { useConfigs } from '../../config/useConfigs'
import { isAddress } from 'ethers/lib/utils'
import { NATIVE_ADDRESS } from '../../../utils/constant'
import _ from 'lodash'
import { bn } from '../../../utils/helpers'

export const useTokenPrice = () => {
  const { chainId } = useConfigs()
  const { prices } = useSelector((state: State) => {
    return {
      prices: state.resources.prices
    }
  })

  return {
    prices: prices[chainId]
  }
}

export const useFetchTokenPrice = () => {
  const { tokens } = useListTokens()
  const { chainId, configs, ddlEngine } = useConfigs()
  const dispatch = useDispatch()

  useEffect(() => {
    fetchPrice()
  }, [ddlEngine, tokens, chainId])

  const fetchPrice = async () => {
    const tokenAddress = _.uniq(
      [...Object.keys(tokens), configs.addresses.wrapToken].filter((a) => {
        return isAddress(a) && a !== NATIVE_ADDRESS
      })
    )

    if (ddlEngine && tokenAddress.length > 0) {
      ddlEngine.PRICE.getTokenPrices(tokenAddress)
        .then((data: any) => {
          dispatch(
            addTokenPriceWithChain({
              prices: data,
              chainId
            })
          )
        })
        .catch((e) => {
          console.error(e)
          const data = {}
          tokenAddress.map((a: string) => {
            data[a] = bn('0x02d198f44116169890a410')
          })
          addTokenPriceWithChain({
            prices: data,
            chainId
          })
        })
    }
  }
}
