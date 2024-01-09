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
import { ListCurrencies } from './components/listCurrencies'
import './style.scss'
import { useTokenValue } from '../SwapBox/hooks/useTokenValue'
import { useListTokens } from '../../state/token/hook'
import { PoolType } from '../../state/resources/type'
const Component = ({
  visible,
  setVisible,
  onDismiss,
  onPoolSelect
}: {
  visible: boolean
  setVisible: any,
  onDismiss: () => void
  selectedCurrency?: Currency | null
  onPoolSelect: (pool: PoolSearch, hasWarning?: boolean) => void
}) => {
  if (!visible) return <Fragment/>
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
  const [poolsFilterSearch, setPoolsFilterSearch] = useState<PoolSearch[]>([])
  const [isLoadingSearch, setIsLoadingSearch] = useState<boolean>(false)
  useMemo(async () => {
    setPoolsFilterSearch(
      (await Promise.all(Object.keys(poolGroups).map(async (key) => {
        const isOracleZero = poolGroups[key]?.ORACLE?.[2] === '0'
        const baseTokenIndex = isOracleZero ? 1 : 0
        const quoteTokenIndex = isOracleZero ? 0 : 1

        const getTokenInfo = async (index:number) => ({
          address: poolGroups[key]?.pair?.[`token${index}`]?.address,
          name: poolGroups[key]?.pair?.[`token${index}`]?.name,
          symbol: poolGroups[key]?.pair?.[`token${index}`]?.symbol,
          logoURI: await getTokenIconUrl(poolGroups[key]?.pair?.[`token${index}`]?.address)
        })

        const baseToken = await getTokenInfo(baseTokenIndex)
        const quoteToken = await getTokenInfo(quoteTokenIndex)

        const pools = Object.keys(poolGroups[key].pools)
          .map(poolKey => poolGroups[key]?.pools?.[poolKey])
          .map((pool:any, _) => {
            return {
              ...pool,
              ...calculatePoolValue(pool)
            }
          }).sort((a:PoolType, b: PoolType) => a?.poolPositionsValue - b?.poolPositionsValue || a?.poolValueR - b?.poolValueR)
        return {
          baseToken,
          quoteToken,
          pools
        }
      }))).filter(getTokenFilter(searchQuery))
    )
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
      const poolAddresses = searchPool.pools.map(pool => pool?.[10])
      const indexID = poolToIndexID(pool)
      if (!indexID) return
      updateCurrentPoolGroup(indexID, poolAddresses)
      setVisible(false)
      if (!hasWarning) onDismiss()
    },
    [onDismiss, onPoolSelect]
  )

  const handleEnter = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    setIsLoadingSearch(true)
    const searchResults = await ddlEngine?.RESOURCE.searchIndex(searchQuery.toUpperCase())
    let poolAddresses:string[] = []
    const poolsSearch = (await Promise.all(Object.keys(searchResults).map(async (key) => {
      const poolSearch = searchResults[key]
      const isOracleZero = poolSearch?.pools?.[0]?.ORACLE?.[2] === '0'
      const baseTokenIndex = isOracleZero ? 1 : 0
      const quoteTokenIndex = isOracleZero ? 0 : 1
      const getTokenInfo = async (index:number) => ({
        address: poolSearch?.pairInfo?.[`token${index}`]?.address,
        name: poolSearch?.pairInfo?.[`token${index}`]?.name,
        symbol: poolSearch?.pairInfo?.[`token${index}`]?.symbol,
        logoURI: await getTokenIconUrl(poolSearch?.pairInfo?.[`token${index}`]?.address)
      })
      poolAddresses = [...poolAddresses, ...poolSearch.pools.map((pool:any[]) => pool?.[10])]
      const baseToken = await getTokenInfo(baseTokenIndex)
      const quoteToken = await getTokenInfo(quoteTokenIndex)
      const pools = poolSearch.pools.map((pool:any) => {
        return {
          ...pool,
          ...calculatePoolValue(pool)
        }
      }).sort((a:PoolType, b: PoolType) => a?.poolPositionsValue - b?.poolPositionsValue || a?.poolValueR - b?.poolValueR)
      return {
        baseToken,
        quoteToken,
        pools
      }
    }))).filter(getTokenFilter(searchQuery))
    const poolsRaw = JSON.stringify(poolsFilterSearch)
    // Check is search results is already have in pools list
    const poolAddressesFilter = poolAddresses.filter(poolAddress => !poolsRaw.includes(poolAddress))
    if (poolAddressesFilter.length === 0) {
      setIsLoadingSearch(false)
      return
    }
    setPoolsFilterSearch(poolsSearch)
    // eslint-disable-next-line no-unused-expressions
    ddlEngine?.RESOURCE.generateData({ poolAddresses: poolAddressesFilter, transferLogs: [] }).then(data => {
      const poolAddressTimestampMap = {}
      poolsSearch.forEach(({ pools }) => {
        pools.forEach((pool:any) => {
          poolAddressTimestampMap[pool?.poolAddress] = pool?.timeStamp
        })
      })

      Object.keys(data.poolGroups).forEach((key) => {
        const poolGroup = data.poolGroups[key]
        Object.keys(poolAddressTimestampMap).forEach((_key) => {
          poolGroup.pools[_key] = {
            ...poolGroup.pools[_key],
            timeStamp: poolAddressTimestampMap[_key]
          }
        })
      })
      addNewResource(data, account)
    })
    setIsLoadingSearch(false)
  }

  return (
    <Modal
      setVisible={setVisible}
      visible={visible}
      title='Select a pool'
    >
      <Input
        inputWrapProps={{
          style: { borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.07)', marginBottom: '1rem' }
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

      {/* <CommonCurrencies/> */}
      <ListCurrencies handlePoolSelect={handlePoolSelect} poolsFilterSearch={poolsFilterSearch} isLoading={isLoadingSearch} />

    </Modal>
  )
}

export const SearchIndexModal = React.memo(Component, (prevProps, nextProps) =>
  isEqual(prevProps, nextProps)
)
