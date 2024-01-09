import { ChainId, Token } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { useAllLists, useCombinedActiveList, useCombinedTokenMapFromUrls, useUnsupportedTokenList } from '../hooks'
import { getTokenFilter } from '../../../utils/filtering'
import { TokenAddressMap } from './useTokenList/utils'

import { DEFAULT_INACTIVE_LIST_URLS, DEFAULT_LIST_OF_LISTS } from '../constants/lists'
import { TokenFromList } from '../tokenFromList'
import { useWeb3React } from '../../customWeb3React/hook'
import { CHAIN_INFO, getChainInfo } from '../constants/chainInfo'
import { tokenComparator } from './useTokenList/sorting'

type Maybe<T> = T | null | undefined

// eslint-disable-next-line no-unused-vars
export type ChainTokenMap = { [chainId in number]?: { [address in string]?: Token } }
// reduce token map into standard address <-> Token mapping, optionally include user added tokens
function useTokensFromMap(tokenMap: TokenAddressMap, chainId: Maybe<ChainId>): { [address: string]: TokenFromList } {
  return useMemo(() => {
    if (!chainId) return {}

    // reduce to just tokens
    return Object.keys(tokenMap[chainId] ?? {}).reduce<{ [address: string]: TokenFromList }>((newMap, address) => {
      newMap[address] = tokenMap[chainId][address].token
      return newMap
    }, {})
  }, [chainId, tokenMap])
}

/** Returns all tokens from the default list + user added tokens */
export function useDefaultActiveTokens(chainId: Maybe<ChainId>): { [address: string]: TokenFromList } {
  const defaultListTokens = useCombinedActiveList(chainId || 56)
  const tokensFromMap = useTokensFromMap(defaultListTokens, chainId)
  return useMemo(() => {
    return tokensFromMap
  }, [tokensFromMap])
}
export function useDefaultInActiveTokens(chainId: Maybe<ChainId>): { [address: string]: TokenFromList } {
  const defaultListTokens = useCombinedTokenMapFromUrls(DEFAULT_LIST_OF_LISTS)
  const tokensFromMap = useTokensFromMap(defaultListTokens, chainId)
  return useMemo(() => {
    return tokensFromMap
  }, [tokensFromMap])
}

// type BridgeInfo = Record<
//   ChainId,
//   {
//     tokenAddress: string
//     originBridgeAddress: string
//     destBridgeAddress: string
//   }
// >
export function useSearchInactiveTokenLists(search: string | undefined, chainId:Maybe<ChainId>, minResults = 10): TokenFromList[] {
  const defaultTokens = useDefaultInActiveTokens(chainId)
  return useMemo(() => {
    if (!search || search.trim().length === 0) return []
    const filteredTokens = Object.values(defaultTokens)
      .filter(getTokenFilter(search)).slice(0, 10)
      // .filter((token) => !(token.address?.toLowerCase() in balances))

    // if (balancesAreLoading) {
    //   return mergedTokens
    // }
    // console.log('#', mergedTokens)
    return filteredTokens
    // .filter((token) => {
    // if (onlyShowCurrenciesWithBalance) {
    //   return balances[token.address?.toLowerCase()]?.usdValue > 0
    // }

    // If there is no query, filter out unselected user-added tokens with no balance.
    // if (!search && token instanceof UserAddedToken) {
    //   if (selectedCurrency?.equals(token) || otherSelectedCurrency?.equals(token)) return true
    //   return balances[token.address.toLowerCase()]?.usdValue > 0
    // }
      //   return true
      // })
      .sort(tokenComparator.bind(null, {}))
  }, [
    search
  ])
  // }, [activeTokens, chainId, inactiveUrls, lists, minResults, search])
}

// Check if currency is included in custom list from user storage
// export function useIsUserAddedToken(currency: Currency | undefined | null): boolean {
//   const userAddedTokens = useUserAddedTokens()

//   if (!currency) {
//     return false
//   }

//   return !!userAddedTokens.find((token: Currency) => currency.equals(token))
// }

// undefined if invalid or does not exist
// null if loading or null was passed
// otherwise returns the token
// export function useToken(tokenAddress?: string | null): Token | null | undefined {
//   const { chainId } = useWeb3React()
//   const tokens = useDefaultActiveTokens(chainId)
//   return useTokenFromMapOrNetwork(tokens, tokenAddress)
// }

/**
 * Returns a Token from the tokenAddress.
 * Returns null if token is loading or null was passed.
 * Returns undefined if tokenAddress is invalid or token does not exist.
 */
// export function useTokenFromMapOrNetwork(tokens: TokenMap, tokenAddress?: string | null): Token | undefined {
//   const address = isAddress(tokenAddress)
//   const token: Token | undefined = address ? tokens[address] : undefined
//   const tokenFromNetwork = useTokenFromActiveNetwork(token ? undefined : address || undefined)

//   return tokenFromNetwork ?? token
// }

// export function useCurrency(currencyId: Maybe<string>, chainId?: ChainId): Currency | undefined {
//   const { chainId: connectedChainId } = useWeb3React()
//   const tokens = useDefaultActiveTokens(chainId ?? connectedChainId)
//   return useCurrencyFromMap(tokens, chainId ?? connectedChainId, currencyId)
// }
