import { Currency } from '@uniswap/sdk-core'
import 'rc-slider/assets/index.css'
import React, { ChangeEvent, Fragment, KeyboardEvent, RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import isEqual from 'react-fast-compare'
import { useConfigs } from '../../state/config/useConfigs'
import { useHelper } from '../../state/config/useHelper'
import { useCurrentPoolGroup } from '../../state/currentPool/hooks/useCurrentPoolGroup'
import { useWeb3React } from '../../state/customWeb3React/hook'
import { useResource } from '../../state/resources/hooks/useResource'
import { getTokenFilter } from '../../utils/filtering'
import { poolToIndexID } from '../../utils/helpers'
import { PoolSearch } from '../../utils/type'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { ListIndexs } from './components/listIndexs'
import './style.scss'
import { useTokenValue } from '../SwapBox/hooks/useTokenValue'
import { useListTokens } from '../../state/token/hook'
import { PoolType } from '../../state/resources/type'
import { IconEnter } from '../ui/Icon'
import { TextGrey } from '../ui/Text'
import { Button, ButtonGrey, ButtonSell } from '../ui/Button'
import { Box } from '../ui/Box'
import { CurrencyGroupLogo } from '../ui/CurrencyGroupLogo'
const Component = ({
  visible,
  setVisible,
  onDismiss,
  onPoolSelect
}: {
  visible: boolean
  setVisible: any
  onDismiss: () => void
  selectedCurrency?: Currency | null
  onPoolSelect: (pool: PoolSearch, hasWarning?: boolean) => void
}) => {
  if (!visible) return <Fragment />
  const [searchQuery, setSearchQuery] = useState<string>('')
  const { ddlEngine } = useConfigs()
  const { account } = useWeb3React()
  const { tokens } = useListTokens()
  const { getTokenIconUrl } = useHelper()
  const { updateCurrentPoolGroup } = useCurrentPoolGroup()
  const { poolGroups, addNewResource, useCalculatePoolValue } = useResource()
  // const { poolGroupsValue } = useCalculatePoolGroupsValue()
  const calculatePoolValue = useCalculatePoolValue()
  const [poolsFilterSearch, setPoolsFilterSearch] = useState<{
    [key: string]: PoolSearch
  }>({})
  const [isLoadingSearch, setIsLoadingSearch] = useState<boolean>(false)
  const [showWarningModal, setShowWarningModal] = useState<
  {status: boolean, indexWarning?: PoolSearch }>({ status: false })
  useMemo(async () => {
    const poolGroupsFilter = {}
    await Promise.all(
      Object.keys(poolGroups).map(async (key) => {
        const isOracleZero = poolGroups[key]?.ORACLE?.[2] === '0'
        const baseTokenIndex = isOracleZero ? 1 : 0
        const quoteTokenIndex = isOracleZero ? 0 : 1

        const getTokenInfo = async (index: number) => ({
          address: poolGroups[key]?.pair?.[`token${index}`]?.address,
          name: poolGroups[key]?.pair?.[`token${index}`]?.name,
          symbol: poolGroups[key]?.pair?.[`token${index}`]?.symbol,
          logoURI: await getTokenIconUrl(
            poolGroups[key]?.pair?.[`token${index}`]?.address
          )
        })

        const baseToken = await getTokenInfo(baseTokenIndex)
        const quoteToken = await getTokenInfo(quoteTokenIndex)

        const pools = Object.keys(poolGroups[key].pools)
          .map((poolKey) => poolGroups[key]?.pools?.[poolKey])
          .map((pool: any, _) => {
            return {
              ...pool,
              ...calculatePoolValue(pool)
            }
          })
          .sort(
            (a: PoolType, b: PoolType) =>
              a?.poolPositionsValue - b?.poolPositionsValue ||
              a?.poolValueR - b?.poolValueR
          )
        const tokenFilter = getTokenFilter(searchQuery)
        const poolGroup = {
          ...poolGroupsFilter[key],
          baseToken,
          quoteToken,
          pools
        }

        if (!tokenFilter(poolGroup)) return
        poolGroupsFilter[key] = poolGroup
        return {}
      })
    )
    setPoolsFilterSearch(poolGroupsFilter)
    // .filter(getTokenFilter(searchQuery))
  }, [poolGroups, searchQuery, tokens])

  const inputRef = useRef<HTMLInputElement>()

  const handleInput = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target.value
    setSearchQuery(input)
  }, [])

  const handlePoolSelect = useCallback(
    (searchPool: PoolSearch, hasWarning?: boolean) => {
      const pool = searchPool.pools?.[0]
      const poolAddresses = searchPool.pools.map((pool) => pool?.[10])
      const indexID = poolToIndexID(pool)
      if (hasWarning) {
        setShowWarningModal({ status: true, indexWarning: searchPool })
        return
      }
      onPoolSelect(searchPool, hasWarning)
      if (!indexID) return
      updateCurrentPoolGroup(indexID, poolAddresses)
      setVisible(false)
      if (!hasWarning) onDismiss()
    },
    [onDismiss, onPoolSelect]
  )
  const handleWarningUnderstand = useCallback(
    (searchPool: PoolSearch) => {
      const pool = searchPool.pools?.[0]
      const poolAddresses = searchPool.pools.map((pool) => pool?.[10])
      const indexID = poolToIndexID(pool)
      onPoolSelect(searchPool, false)
      if (!indexID) return
      updateCurrentPoolGroup(indexID, poolAddresses)
      setVisible(false)
    },
    [onDismiss, onPoolSelect]
  )
  const handleWarningCancel = () => {
    setShowWarningModal({ status: false, indexWarning: undefined })
  }
  const handleEnter = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.keyCode !== 13 && e.key !== 'Enter') return
    setIsLoadingSearch(true)
    const searchResults = await ddlEngine?.RESOURCE.searchIndex(
      searchQuery.toUpperCase()
    )
    const poolGroupsFilter = {}
    let poolAddresses: string[] = []
    await Promise.all(
      Object.keys(searchResults).map(async (key) => {
        const poolSearch = searchResults[key]
        const isOracleZero = poolSearch?.pools?.[0]?.ORACLE?.[2] === '0'
        const baseTokenIndex = isOracleZero ? 1 : 0
        const quoteTokenIndex = isOracleZero ? 0 : 1
        const getTokenInfo = async (index: number) => ({
          address: poolSearch?.pairInfo?.[`token${index}`]?.address,
          name: poolSearch?.pairInfo?.[`token${index}`]?.name,
          symbol: poolSearch?.pairInfo?.[`token${index}`]?.symbol,
          logoURI: await getTokenIconUrl(
            poolSearch?.pairInfo?.[`token${index}`]?.address
          )
        })
        // if (poolGroups[key]?.pools) return
        poolAddresses = [
          ...poolAddresses,
          ...poolSearch.pools.map((pool: any) => pool?.poolAddress)
        ]
        const baseToken = await getTokenInfo(baseTokenIndex)
        const quoteToken = await getTokenInfo(quoteTokenIndex)
        const pools = poolSearch.pools.map((pool: any) => {
          return pool
        })
        poolGroupsFilter[key] = {
          baseToken,
          quoteToken,
          pools
        }
      })
    )
    if (poolAddresses.length === 0) {
      setIsLoadingSearch(false)
      return
    }
    setPoolsFilterSearch(poolGroupsFilter)
    // eslint-disable-next-line no-unused-expressions
    ddlEngine?.RESOURCE.generateData({ poolAddresses, transferLogs: [] })
      .then((data) => {
        const poolAddressTimestampMap = {}
        Object.keys(poolGroupsFilter).map((key) => {
          const pools = poolGroupsFilter[key].pools
          pools.forEach((pool: any) => {
            poolAddressTimestampMap[pool?.poolAddress] = pool?.timeStamp
          })
        })
        Object.keys(data.poolGroups).forEach((key) => {
          const poolGroup = data.poolGroups[key]
          Object.keys(data.poolGroups[key].pools).forEach((_key) => {
            data.poolGroups[key].pools[_key] = {
              ...poolGroup.pools[_key],
              timeStamp: poolAddressTimestampMap[_key]
            }
          })
        })
        addNewResource(data, account)
      })
      .catch((e) => {
        console.log(e)
      })
    setIsLoadingSearch(false)
  }

  return (
    <Modal setVisible={setVisible} visible={visible} title={showWarningModal.status ? 'Unverified Index' : 'Select an index'}>
      {showWarningModal.status ? <WarningContent onCancel={handleWarningCancel} onUnderStand={handleWarningUnderstand} indexWarning={showWarningModal.indexWarning}/>
        : <Fragment>
          <Input
            inputWrapProps={{
              style: {
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                marginBottom: '1rem'
              }
            }}
            type='text'
            id='token-search-input'
            data-testid='token-search-input'
            autoComplete='off'
            value={searchQuery}
            ref={inputRef as RefObject<HTMLInputElement>}
            onChange={handleInput}
            onKeyDown={handleEnter}
            suffix={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <IconEnter size={24} />
                <TextGrey>Enter</TextGrey>
              </div>
            }
            placeholder='Search symbol or address'
          />

          {/* <CommonCurrencies/> */}
          <ListIndexs
            handlePoolSelect={handlePoolSelect}
            poolsFilterSearch={poolsFilterSearch}
            isLoading={isLoadingSearch}
          />
        </Fragment>}
    </Modal>
  )
}
const WarningContent = ({
  indexWarning,
  onUnderStand,
  onCancel
}: {
  indexWarning?: PoolSearch
  onUnderStand: (poolSearch: PoolSearch) => void
  onCancel: () => void
}) => {
  if (!indexWarning?.baseToken && !indexWarning?.quoteToken) return <Fragment/>
  return <Box className='index-warning__wrapped'>
    <Box className='index-warning__wrapped-logo'>
      <CurrencyGroupLogo
        currencyURIs={[indexWarning?.baseToken.logoURI || '', indexWarning?.quoteToken.logoURI || '']}
        size={[48, 36]}
      />
    </Box>
    <TextGrey className='index-warning__body'>
      This index and its pools are not verified by Derivable Labs.
      As an open protocol, anyone can create pools for any price index and parameters.
      <br/><br/>
      Make sure you understand all parameters of the pools you participate in, and always conduct your own research before trading.
    </TextGrey>
    <Box className='index-warning__options'>
      <ButtonGrey className='index-warning__understand' onClick={() => { if (indexWarning) onUnderStand(indexWarning) }} >I Understand</ButtonGrey>
      <TextGrey className='index-warning__cancel' onClick={onCancel} fontSize={12}>Cancel</TextGrey>
    </Box>
  </Box>
}
export const SearchIndexModal = React.memo(Component, (prevProps, nextProps) =>
  isEqual(prevProps, nextProps)
)
