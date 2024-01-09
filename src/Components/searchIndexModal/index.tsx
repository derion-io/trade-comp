import { Token } from '@uniswap/sdk-core'
import 'rc-slider/assets/index.css'
import React, { Fragment, useEffect, useMemo, useState } from 'react'
import isEqual from 'react-fast-compare'
import useDebounce from '../../hooks/useDebounce'
import { getTokenFilter } from '../../state/lists/hook/useTokenList/filtering'
import { tokenComparator, useSortTokensByQuery } from '../../state/lists/hook/useTokenList/sorting'
import { useDefaultActiveTokens } from '../../state/lists/hook/useTokens'
import { isAddress } from '../../state/lists/utils/isAddress'
import { Modal } from '../ui/Modal'
import { ListCurrencies } from './components/listCurrencies'
import { SearchCurrencies } from './components/searchCurrencies'
import './style.scss'
import { TokenFromList } from '../../state/lists/tokenFromList'
import { CommonCurrencies } from './components/commonCurrencies'
import { Divider } from '../ui/Divider'
const Component = ({
  visible,
  setVisible
}: {
  visible: boolean
  setVisible: any
}) => {
  if (!visible) return <Fragment/>
  const defaultTokens = useDefaultActiveTokens(56)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const debouncedQuery = useDebounce(searchQuery, 200)
  const isAddressSearch = isAddress(debouncedQuery)
  const sortedTokens: Token[] = useMemo(() => {
    const filteredTokens = Object.values(defaultTokens)
      .filter(getTokenFilter(debouncedQuery))
      // .filter((token) => !(token.address?.toLowerCase() in balances))
    const mergedTokens = filteredTokens

    // if (balancesAreLoading) {
    //   return mergedTokens
    // }
    console.log('#', mergedTokens)
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
    // balancesAreLoading,
    // balances,
    // chainId,
    // onlyShowCurrenciesWithBalance,
    // selectedCurrency,
    // otherSelectedCurrency
  ])

  // const isLoading = Boolean(balancesAreLoading && !tokenLoaderTimerElapsed)

  const filteredSortedTokens = useSortTokensByQuery(debouncedQuery, sortedTokens) as TokenFromList[]

  useEffect(() => {
    console.log('#', filteredSortedTokens)
  }, [filteredSortedTokens])

  return (
    <Modal
      setVisible={setVisible}
      visible={visible}
      title='Select a token'
    >
      <SearchCurrencies
        value='123'
        placeholder='Search name or paste address'
      />
      <CommonCurrencies/>
      <div className='search-index__hr'/>
      <ListCurrencies currencies={filteredSortedTokens}/>
    </Modal>
  )
}

export const SearchIndexModal = React.memo(Component, (prevProps, nextProps) =>
  isEqual(prevProps, nextProps)
)
