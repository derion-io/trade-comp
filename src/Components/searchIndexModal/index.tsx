import { Token, Currency } from '@uniswap/sdk-core'
import 'rc-slider/assets/index.css'
import React, { ChangeEvent, Fragment, KeyboardEvent, RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import isEqual from 'react-fast-compare'
import useDebounce from '../../hooks/useDebounce'
import { getTokenFilter } from '../../state/lists/hook/useTokenList/filtering'
import { tokenComparator, useSortTokensByQuery } from '../../state/lists/hook/useTokenList/sorting'
import { useDefaultActiveTokens, useSearchInactiveTokenLists } from '../../state/lists/hook/useTokens'
import { isAddress } from '../../state/lists/utils/isAddress'
import { Modal } from '../ui/Modal'
import { ListCurrencies } from './components/listCurrencies'
// import { SearchCurrencies } from './components/searchCurrencies'
import './style.scss'
import { TokenFromList } from '../../state/lists/tokenFromList'
import { CommonCurrencies } from './components/commonCurrencies'
import { Divider } from '../ui/Divider'
import { Input } from '../ui/Input'
const Component = ({
  visible,
  setVisible,
  onDismiss,
  onCurrencySelect
}: {
  visible: boolean
  setVisible: any,
  onDismiss: () => void
  selectedCurrency?: Currency | null
  onCurrencySelect: (currency: Currency, hasWarning?: boolean) => void
}) => {
  if (!visible) return <Fragment/>
  const chainId = 56
  const defaultTokens = useDefaultActiveTokens(chainId)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const debouncedQuery = useDebounce(searchQuery, 200)
  const isAddressSearch = isAddress(debouncedQuery)
  const filteredSortedTokens: TokenFromList[] = useMemo(() => {
    const filteredTokens = Object.values(defaultTokens)
      .filter(getTokenFilter(debouncedQuery))
      // .filter((token) => !(token.address?.toLowerCase() in balances))
    const mergedTokens = filteredTokens

    // if (balancesAreLoading) {
    //   return mergedTokens
    // }
    // console.log('#', mergedTokens)
    return mergedTokens
    // .filter((token) => {
    // if (onlyShowCurrenciesWithBalance) {
    //   return balances[token.address?.toLowerCase()]?.usdValue > 0
    // }

    // If there is no query, filter out unselected user-added tokens with no balance.
    // if (!debouncedQuery && token instanceof UserAddedToken) {
    //   if (selectedCurrency?.equals(token) || otherSelectedCurrency?.equals(token)) return true
    //   return balances[token.address.toLowerCase()]?.usdValue > 0
    // }
      //   return true
      // })
      .sort(tokenComparator.bind(null, {}))
  }, [
    // data,
    defaultTokens,
    debouncedQuery

  ])
  const filteredInactiveTokens = useSearchInactiveTokenLists(
    (filteredSortedTokens.length === 0 || (debouncedQuery.length > 2 && !isAddressSearch))
      ? debouncedQuery
      : undefined,
    chainId
  )
  console.log('#filteredInactiveTokens', filteredInactiveTokens)
  console.log('#filteredSortedTokens', filteredSortedTokens)
  const inputRef = useRef<HTMLInputElement>()

  const handleInput = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target.value
    const checksummedInput = isAddress(input)
    setSearchQuery(checksummedInput || input)
  }, [])

  const handleCurrencySelect = useCallback(
    (currency: Currency, hasWarning?: boolean) => {
      onCurrencySelect(currency, hasWarning)
      if (!hasWarning) onDismiss()
    },
    [onDismiss, onCurrencySelect]
  )

  const handleEnter = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      // if (e.key === 'Enter') {
      //   if (searchCurrencies.length > 0) {
      //     if (
      //       searchCurrencies[0].symbol?.toLowerCase() === debouncedQuery.trim().toLowerCase() ||
      //       searchCurrencies.length === 1
      //     ) {
      //       handleCurrencySelect(searchCurrencies[0])
      //     }
      //   }
      // }
    },
    [debouncedQuery, handleCurrencySelect]
  )

  return (
    <Modal
      setVisible={setVisible}
      visible={visible}
      title='Select a token'
    >
      <Input
        inputWrapProps={{
          style: { borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.07)' }
        }}
        type='text'
        id='token-search-input'
        data-testid='token-search-input'
        autoComplete='off'
        value={searchQuery}
        ref={inputRef as RefObject<HTMLInputElement>}
        onChange={handleInput}
        onKeyDown={handleEnter}
        placeholder='Search name or paste address'/>

      <CommonCurrencies/>
      <div className='search-index__hr'/>
      <ListCurrencies currencies={filteredSortedTokens.length === 0 ? filteredInactiveTokens : filteredSortedTokens}/>
    </Modal>
  )
}

export const SearchIndexModal = React.memo(Component, (prevProps, nextProps) =>
  isEqual(prevProps, nextProps)
)
