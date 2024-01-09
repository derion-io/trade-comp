import { TokenAddressMap, tokensToChainTokenMap } from './hook/useTokenList/utils'
import { useMemo } from 'react'
import sortByListPriority from './utils/listSort'
import BROKEN_LIST from './constants/tokenLists/broken.tokenlist.json'
import { DEFAULT_ACTIVE_LIST_URLS, DEFAULT_INACTIVE_LIST_URLS, UNSUPPORTED_LIST_URLS } from './constants/lists'
import { TypedUseSelectorHook, useSelector } from 'react-redux'
import { store } from '../index'
import { CHAIN_INFO } from './constants/chainInfo'
import { useWeb3React } from '../customWeb3React/hook'

type Mutable<T> = {
  -readonly [P in keyof T]: Mutable<T[P]>
}
export const useAppSelector: TypedUseSelectorHook<ReturnType<typeof store.getState>> = useSelector

export function useAllLists(): any {
  return useAppSelector((state) => {
    return state.lists.byUrl
  })
}

/**
 * Combine the tokens in map2 with the tokens on map1, where tokens on map1 take precedence
 * @param map1 the base token map
 * @param map2 the map of additioanl tokens to add to the base map
 */
function combineMaps(map1: TokenAddressMap, map2: TokenAddressMap): TokenAddressMap {
  const chainIds = Object.keys(
    Object.keys(map1)
      .concat(Object.keys(map2))
      .reduce<{ [chainId: string]: true }>((memo, value) => {
        memo[value] = true
        return memo
      }, {})
  ).map((id) => parseInt(id))

  return chainIds.reduce<Mutable<TokenAddressMap>>((memo, chainId) => {
    memo[chainId] = {
      ...map2[chainId],
      // map1 takes precedence
      ...map1[chainId]
    }
    return memo
  }, {}) as TokenAddressMap
}

// merge tokens contained within lists from urls
export function useCombinedTokenMapFromUrls(urls: string[] | undefined): TokenAddressMap {
  const lists = useAllLists()
  return useMemo(() => {
    if (!urls) return {}
    return (
      urls
        .slice()
        // sort by priority so top priority goes last
        .sort(sortByListPriority)
        .reduce((allTokens, currentUrl) => {
          const current = lists[currentUrl]?.current
          if (!current) return allTokens
          try {
            return combineMaps(allTokens, tokensToChainTokenMap(current))
          } catch (error) {
            console.error('Could not show token list due to error', error)
            return allTokens
          }
        }, {})
    )
  }, [lists, urls])
}

// get all the tokens from active lists, combine with local default tokens
export function useCombinedActiveList(chainId: number = 56): TokenAddressMap {
  const chain = CHAIN_INFO[chainId]
  const activeTokens = useCombinedTokenMapFromUrls(chain?.defaultListUrl ? [chain?.defaultListUrl] : DEFAULT_ACTIVE_LIST_URLS)
  return activeTokens
}

// list of tokens not supported on interface for various reasons, used to show warnings and prevent swaps and adds
export function useUnsupportedTokenList(): TokenAddressMap {
  // get hard-coded broken tokensFuseTokenInfoFromActiveList
  const brokenListMap = useMemo(() => tokensToChainTokenMap(BROKEN_LIST), [])

  // get dynamic list of unsupported tokens
  const loadedUnsupportedListMap = useCombinedTokenMapFromUrls(UNSUPPORTED_LIST_URLS)

  // format into one token address map
  return useMemo(() => combineMaps(brokenListMap, loadedUnsupportedListMap), [brokenListMap, loadedUnsupportedListMap])
}
