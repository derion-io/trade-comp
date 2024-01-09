import { Currency } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { useCombinedActiveList } from '../state/lists/hooks'

/** Returns a TokenFromList from the active token lists when possible, or the passed token otherwise. */
export function useTokenInfoFromActiveList(currency: Currency, chainId: number) {
  const activeList = useCombinedActiveList(chainId)
  return useMemo(() => {
    if (!chainId) return
    try {
      return activeList[chainId][currency.wrapped.address].token
    } catch (e) {
      console.log(e)
      return currency
    }
  }, [activeList, chainId, currency])
}
