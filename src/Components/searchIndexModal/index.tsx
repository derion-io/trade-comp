import { Token, Currency } from '@uniswap/sdk-core'
import 'rc-slider/assets/index.css'
import React, { ChangeEvent, Fragment, KeyboardEvent, RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import isEqual from 'react-fast-compare'
import useDebounce from '../../hooks/useDebounce'
import { getTokenFilter } from '../../utils/filtering'
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
import { useConfigs } from '../../state/config/useConfigs'
import { useResource } from '../../state/resources/hooks/useResource'
import { useHelper } from '../../state/config/useHelper'
import { TokenFromPoolGroup } from '../../utils/type'
import { useCurrentPoolGroup } from '../../state/currentPool/hooks/useCurrentPoolGroup'
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
  onCurrencySelect: (currency: TokenFromPoolGroup, hasWarning?: boolean) => void
}) => {
  if (!visible) return <Fragment/>
  const chainId = 56
  // const defaultTokens = useDefaultActiveTokens(chainId)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const { ddlEngine } = useConfigs()
  const { getTokenIconUrl } = useHelper()
  const { updateCurrentPoolGroup, id } = useCurrentPoolGroup()
  const { poolGroups } = useResource()
  const [whiteListFilterPools, setWhiteListFilterPools] = useState<TokenFromPoolGroup[]>([])
  // const [inWhiteListFilterPools, setInWhiteListFilterPools] = useState<TokenFromPoolGroup[]>([])
  const [isLoadingSearch, setIsLoadingSearch] = useState<boolean>(false)
  useEffect(() => {
    console.log('#id', id)
  }, [id])
  useMemo(async () => {
    setWhiteListFilterPools(
      (await Promise.all(Object.keys(poolGroups).map(async (key) => {
        const bti = poolGroups[key]?.ORACLE === '0' ? 1 : 0
        const address = poolGroups[key]?.pair?.[`token${bti}`]?.address
        return {
          address,
          name: poolGroups[key]?.pair?.[`token${bti}`]?.name,
          symbol: poolGroups[key]?.pair?.[`token${bti}`]?.symbol,
          logoURI: await getTokenIconUrl(address),
          poolGroup: Object.keys(poolGroups[key].pools).map(poolKey => poolGroups[key]?.pools?.[poolKey])
        }
      }))).filter(getTokenFilter(searchQuery))
    )
  }, [poolGroups, searchQuery])

  const inputRef = useRef<HTMLInputElement>()

  const handleInput = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target.value
    setSearchQuery(input)
    console.log('#', input)
  }, [])

  const handleCurrencySelect = useCallback(
    (currency: TokenFromPoolGroup, hasWarning?: boolean) => {
      onCurrencySelect(currency, hasWarning)
      const oracle = currency.poolGroup?.[0]?.ORACLE
      const newID = oracle ? '0x' + (oracle as String).slice(oracle.length - 40, oracle.length) : ''
      updateCurrentPoolGroup(newID)
      setVisible(false)
      if (!hasWarning) onDismiss()
    },
    [onDismiss, onCurrencySelect]
  )

  const handleEnter = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    setIsLoadingSearch(true)
    const poolsSearch = await ddlEngine?.RESOURCE.searchIndex(searchQuery.toUpperCase())
    setWhiteListFilterPools((await Promise.all(Object.keys(poolsSearch).map(async (key) => {
      const poolSearch = poolsSearch[key]
      const bti = poolSearch?.pools?.[0]?.ORACLE === '0' ? 1 : 0
      const address = poolSearch?.pairInfo?.[`token${bti}`]?.address
      return {
        address,
        name: poolSearch?.pairInfo?.[`token${bti}`]?.name,
        symbol: poolSearch?.pairInfo?.[`token${bti}`]?.symbol,
        logoURI: await getTokenIconUrl(address),
        poolGroup: poolSearch.pools
      }
    }))).filter(getTokenFilter(searchQuery)))
    setIsLoadingSearch(false)
  }

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
      <ListCurrencies handleCurrencySelect={handleCurrencySelect} currencies={whiteListFilterPools} isLoading={isLoadingSearch} />

    </Modal>
  )
}

export const SearchIndexModal = React.memo(Component, (prevProps, nextProps) =>
  isEqual(prevProps, nextProps)
)
