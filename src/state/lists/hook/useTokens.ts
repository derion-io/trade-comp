import { ChainId, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { useMemo } from 'react'
import { useAllLists, useCombinedActiveList } from '../hooks'
import { getTokenFilter } from './useTokenList/filtering'
import { TokenAddressMap } from './useTokenList/utils'

import { DEFAULT_INACTIVE_LIST_URLS } from '../constants/lists'
import { TokenFromList } from '../tokenFromList'

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
  const defaultListTokens = useCombinedActiveList()
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

// export function useUnsupportedTokens(): { [address: string]: Token } {
//   const { chainId } = useWeb3React()
//   const listsByUrl = useAllLists()
//   const unsupportedTokensMap = useUnsupportedTokenList()
//   const unsupportedTokens = useTokensFromMap(unsupportedTokensMap, chainId)

//   // checks the default L2 lists to see if `bridgeInfo` has an L1 address value that is unsupported
//   const l2InferredBlockedTokens: typeof unsupportedTokens = useMemo(() => {
//     if (!chainId || !isL2ChainId(chainId)) {
//       return {}
//     }

//     if (!listsByUrl) {
//       return {}
//     }

//     const listUrl = getChainInfo(chainId).defaultListUrl

//     const list = listsByUrl[listUrl]?.current
//     if (!list) {
//       return {}
//     }

//     const unsupportedSet = new Set(Object.keys(unsupportedTokens))

//     return list.tokens.reduce((acc: Currency, tokenInfo: any) => {
//       const bridgeInfo = tokenInfo.extensions?.bridgeInfo as unknown as BridgeInfo
//       if (
//         bridgeInfo &&
//         bridgeInfo[ChainId.MAINNET] &&
//         bridgeInfo[ChainId.MAINNET].tokenAddress &&
//         unsupportedSet.has(bridgeInfo[ChainId.MAINNET].tokenAddress)
//       ) {
//         const address = bridgeInfo[ChainId.MAINNET].tokenAddress
//         // don't rely on decimals--it's possible that a token could be bridged w/ different decimals on the L2
//         return { ...acc, [address]: new Token(ChainId.MAINNET, address, tokenInfo.decimals) }
//       }
//       return acc
//     }, {})
//   }, [chainId, listsByUrl, unsupportedTokens])

//   return { ...unsupportedTokens, ...l2InferredBlockedTokens }
// }

export function useSearchInactiveTokenLists(search: string | undefined, minResults = 10): TokenFromList[] {
  const lists = useAllLists()
  const inactiveUrls = DEFAULT_INACTIVE_LIST_URLS
  const { chainId } = useWeb3React()
  const activeTokens = useDefaultActiveTokens(chainId)
  return useMemo(() => {
    if (!search || search.trim().length === 0) return []
    const tokenFilter = getTokenFilter(search)
    const result: TokenFromList[] = []
    const addressSet: { [address: string]: true } = {}
    for (const url of inactiveUrls) {
      const list = lists[url]?.current
      if (!list) continue
      for (const tokenInfo of list.tokens) {
        if (tokenInfo.chainId === chainId && tokenFilter(tokenInfo)) {
          try {
            const wrapped: TokenFromList = new TokenFromList(tokenInfo, list)
            if (!(wrapped.address in activeTokens) && !addressSet[wrapped.address]) {
              addressSet[wrapped.address] = true
              result.push(wrapped)
              if (result.length >= minResults) return result
            }
          } catch {
            continue
          }
        }
      }
    }
    return result
  }, [activeTokens, chainId, inactiveUrls, lists, minResults, search])
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
