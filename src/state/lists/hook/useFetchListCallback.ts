import { nanoid } from '@reduxjs/toolkit'
import { TokenList } from '@uniswap/token-lists'
// import { DEPRECATED_RPC_PROVIDERS, RPC_PROVIDERS } from 'constants/providers'
// import { useFallbackProviderEnabled } from 'featureFlags/flags/fallbackProvider'
import getTokenList from '../hook/useTokenList/fetchTokenList'
// import resolveENSContentHash from '../utils/resolveENSContentHash'
import { useCallback } from 'react'
import { fetchTokenList } from '../actions'
import { useDispatch } from 'react-redux'

export function useFetchListCallback(): (listUrl: string, skipValidation?: boolean) => Promise<TokenList> {
  const dispatch = useDispatch()
  // const providers = useFallbackProviderEnabled() ? RPC_PROVIDERS : DEPRECATED_RPC_PROVIDERS

  return useCallback(
    async (listUrl: string, skipValidation?: boolean) => {
      const requestId = nanoid()
      dispatch(fetchTokenList.pending({ requestId, url: listUrl }))
      return getTokenList(
        listUrl,
        (ensName: string) => ensName,
        skipValidation
      )
        .then((tokenList:any) => {
          dispatch(fetchTokenList.fulfilled({ url: listUrl, tokenList, requestId }))
          return tokenList
        })
        .catch((error :any) => {
          console.debug(`Failed to get list at url ${listUrl}`, error)
          dispatch(fetchTokenList.rejected({ url: listUrl, requestId, errorMessage: error.message }))
          throw error
        })
    },
    [dispatch]
  )
}
