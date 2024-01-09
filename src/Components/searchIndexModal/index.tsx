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
import { IEW, NUM, poolToIndexID } from '../../utils/helpers'
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
  const { getTokenValue } = useTokenValue({})
  const { updateCurrentPoolGroup } = useCurrentPoolGroup()
  const { poolGroups, addNewResource, useCalculatePoolValue } = useResource()
  // const { poolGroupsValue } = useCalculatePoolGroupsValue()
  const calculatePoolValue = useCalculatePoolValue()
  const [poolsFilterSearch, setPoolsFilterSearch] = useState<{
    [key: string]: PoolSearch
  }>({})
  const [isLoadingSearch, setIsLoadingSearch] = useState<boolean>(false)
  useEffect(() => {
    console.log('#poolGroups', poolGroups)
  }, [poolGroups])
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
      onPoolSelect(searchPool, hasWarning)
      const pool = searchPool.pools?.[0]
      const poolAddresses = searchPool.pools.map((pool) => pool?.[10])
      const indexID = poolToIndexID(pool)
      if (!indexID) return
      updateCurrentPoolGroup(indexID, poolAddresses)
      setVisible(false)
      if (!hasWarning) onDismiss()
    },
    [onDismiss, onPoolSelect]
  )

  const handleEnter = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.keyCode !== 13 && e.key !== 'Enter') return
    setIsLoadingSearch(true)
    const searchResults = await ddlEngine?.RESOURCE.searchIndex(
      searchQuery.toUpperCase()
    )
    console.log('#searchResults', searchResults, e)
    console.log('#poolsFilterSearch', poolsFilterSearch)
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
        if (poolGroups[key]?.pools) return
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
        console.log('#poolAddresses', poolAddresses)
        console.log('#generateData', data)
        const poolAddressTimestampMap = {}
        Object.keys(poolGroupsFilter).map((key) => {
          const pools = poolGroupsFilter[key].pools
          pools.forEach((pool: any) => {
            poolAddressTimestampMap[pool?.poolAddress] = pool?.timeStamp
          })
        })
        console.log('#poolAddressTimestampMap', poolAddressTimestampMap)
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
    <Modal setVisible={setVisible} visible={visible} title='Select an index'>
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
    </Modal>
  )
}

export const SearchIndexModal = React.memo(Component, (prevProps, nextProps) =>
  isEqual(prevProps, nextProps)
)
