import React, { useEffect, useMemo, useState } from 'react'
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs'
import 'react-tabs/style/react-tabs.css'
import { BuyPositionBox } from '../../Components/BuyPositionBox'
import { Chart } from '../../Components/Chart'
import { ErrorBoundary } from '../../Components/ErrorBoundary'
import { Positions } from '../../Components/Positions'
import { SettingModal } from '../../Components/SettingModal'
import { SwapBox } from '../../Components/SwapBox'
import { WalletHistoryTable } from '../../Components/WalletHistoryTable'
import { Card } from '../../Components/ui/Card'
import { SettingIcon } from '../../Components/ui/Icon'
import { useConfigs } from '../../state/config/useConfigs'
import { useCurrentPoolGroup } from '../../state/currentPool/hooks/useCurrentPoolGroup'
import { useResource } from '../../state/resources/hooks/useResource'
import { useWalletBalance } from '../../state/wallet/hooks/useBalances'
import { useSwapHistory } from '../../state/wallet/hooks/useSwapHistory'
import { POOL_IDS, TRADE_TYPE } from '../../utils/constant'
import { fetch24hChange } from '../../utils/fetch24hChange'
import { bn, decodeErc1155Address, isErc1155Address } from '../../utils/helpers'
import './style.scss'
import { PoolSearch } from '../../utils/type'

const TAB_2 = {
  POSITION: Symbol('position'),
  HISTORY: Symbol('history')
}

const TAB_INDEX_TO_PATH = {
  [TRADE_TYPE.LONG]: '/long',
  [TRADE_TYPE.SHORT]: '/short',
  [TRADE_TYPE.SWAP]: '/swap',
  [TRADE_TYPE.LIQUIDITY]: '/liquidity'
}

const SIMULATE_URL = 'https://1.com'

export const Trade = ({
  tab,
  loadingData
}: {
  tab: TRADE_TYPE
  loadingData: boolean
}) => {
  const { chainId, useHistory, configs, ddlEngine } = useConfigs()
  const history = useHistory()
  const [changedIn24h, setChangedIn24h] = useState<number>(0)
  const { poolGroups, addNewResource, onPoolSwitched } = useResource()
  const { updateCurrentPoolGroup, id } = useCurrentPoolGroup()
  const [tab2, setTab2] = useState<Symbol>(TAB_2.POSITION)
  const { formartedSwapLogs: swapTxs } = useSwapHistory()
  const [inputTokenAddress, setInputTokenAddress] = useState<string>('')
  const [outputTokenAddress, setOutputTokenAddress] = useState<string>('')
  const [visibleSettingModal, setVisibleSettingModal] = useState<boolean>(false)
  const { maturities } = useWalletBalance()
  const tokenOutMaturity = maturities?.[outputTokenAddress] || bn(0)

  useEffect(() => {
    const url =
      location.href.split('?').length > 1
        ? `${SIMULATE_URL}?${location.href.split('?')[1]}`
        : SIMULATE_URL
    const urlSearchParams = new URL(url).searchParams
    // if (id) {
    // urlSearchParams.set('index', id)
    // }
    if (outputTokenAddress && isErc1155Address(outputTokenAddress)) {
      const pool = decodeErc1155Address(outputTokenAddress).address
      urlSearchParams.set('pool', pool)
      onPoolSwitched(pool)
    }

    history.push({
      search: '?' + urlSearchParams.toString()
    })
  }, [outputTokenAddress, id])

  useEffect(() => {
    if (id && configs) {
      fetch24hChange({
        pairAddress: configs?.chartReplacements?.[id] ?? id.split('-')?.[0],
        gtID: configs.gtID
      }).then((res) => {
        setChangedIn24h(Number(res?.h24 || 0))
      })
    }
  }, [id, configs])

  useEffect(() => {
    if (poolGroups && Object.keys(poolGroups).length > 0) {
      const url = location.href
      const urlSearchParams = new URL(`https://1.com?${url.split('?')[1]}`)
        .searchParams

      let index =
        // urlSearchParams.get('index') ??
        localStorage.getItem('activeIndex-' + chainId)

      if (!index || !poolGroups[index]) {
        index = Object.keys(poolGroups)[0]
      }

      if (index && poolGroups[index]) {
        updateCurrentPoolGroup(index)
        const pool = urlSearchParams.get('pool')
        if (pool && poolGroups[index].pools[pool]) {
          if (tab === TRADE_TYPE.LONG) {
            setOutputTokenAddress(pool + '-' + POOL_IDS.A)
          } else if (tab === TRADE_TYPE.SHORT) {
            setOutputTokenAddress(pool + '-' + POOL_IDS.B)
          } else if (tab === TRADE_TYPE.LIQUIDITY) {
            setOutputTokenAddress(pool + '-' + POOL_IDS.C)
          }
        }
      }
    }
  }, [chainId, JSON.stringify(Object.keys(poolGroups || {}))])

  const [searchIndexCache, setSearchIndexCache] = useState<{[key:string] : any}>({})
  const [isLoadingIndex, setIsLoadingIndex] = useState<boolean>(false)
  const [showAllPool, setShowAllPool] = useState<boolean>(false)
  useMemo(() => {
    if (id && ddlEngine && ddlEngine?.RESOURCE && poolGroups[id]?.baseToken && !isLoadingIndex && !searchIndexCache[poolGroups[id]?.baseToken]) {
      setShowAllPool(false)
      setIsLoadingIndex(true)
      ddlEngine.RESOURCE.searchIndex(poolGroups[id]?.baseToken).then((res) => {
        const poolAddresses = (res[id] as PoolSearch)?.pools?.map((pool) => pool?.poolAddress) || []
        if (poolAddresses.length === 0) {
          setIsLoadingIndex(false)
          return
        }
        ddlEngine.RESOURCE.generateData({ poolAddresses, transferLogs: [] })
          .then((data) => {
            setSearchIndexCache({
              ...searchIndexCache,
              ...{ [poolGroups[id]?.baseToken]: data?.poolGroups[id] }
            })
            addNewResource(data)
            setIsLoadingIndex(false)
          })
          .catch((e) => setIsLoadingIndex(false))
      }).catch(e => setIsLoadingIndex(false))
    }
  }, [id])

  return (
    <div className={`exposure-page ${loadingData && 'blur-3'}`}>
      <div className='exposure-page__content'>
        {/* @ts-ignore */}
        <ErrorBoundary>
          <Chart inputTokenAddress={inputTokenAddress}
            setInputTokenAddress={setInputTokenAddress}
            outputTokenAddress={outputTokenAddress}
            setOutputTokenAddress={setOutputTokenAddress} changedIn24h={changedIn24h} />
        </ErrorBoundary>
        <Tabs
          className='exposure-page__content--position-and-history'
          selectedIndex={tab2 === TAB_2.POSITION ? 0 : 1}
          onSelect={(index) => {
            setTab2(index === 0 ? TAB_2.POSITION : TAB_2.HISTORY)
          }}
        >
          <TabList>
            <Tab>
              {tab === TRADE_TYPE.SWAP
                ? 'Positions and LPs'
                : tab === TRADE_TYPE.LIQUIDITY
                  ? 'LPs'
                  : 'Positions'}
            </Tab>
            <Tab>History</Tab>
          </TabList>
          <TabPanel>
            <Card className='card-in-tab'>
              {/* @ts-ignore */}
              <ErrorBoundary>
                <Positions
                  setOutputTokenAddressToBuy={
                    tab === TRADE_TYPE.SWAP
                      ? setInputTokenAddress
                      : setOutputTokenAddress
                  }
                  tokenOutMaturity={tokenOutMaturity}
                />
              </ErrorBoundary>
            </Card>
          </TabPanel>
          <TabPanel>
            <Card className='card-in-tab'>
              {/* @ts-ignore */}
              <ErrorBoundary>
                <WalletHistoryTable swapTxs={swapTxs} />
              </ErrorBoundary>
            </Card>
          </TabPanel>
        </Tabs>
        {/* </div> */}
        <div className='exposure-page__content--trade-box'>
          <div
            className='settings-button'
            style={{
              height: 0,
              zIndex: 0,
              margin: 0,
              cursor: 'pointer'
            }}
            onClick={() => {
              setVisibleSettingModal(true)
            }}
          >
            <SettingIcon
              style={{
                float: 'right',
                margin: '0.4rem'
              }}
            />
          </div>
          <Tabs
            selectedIndex={tab}
            onSelect={(index) => {
              history.push({
                pathname: TAB_INDEX_TO_PATH[index],
                search:
                  location.href.split('?').length > 1
                    ? `?${location.href.split('?')[1]}`
                    : ''
              })
            }}
          >
            <TabList>
              <Tab>Long</Tab>
              <Tab>Short</Tab>
              <Tab>Swap</Tab>
              <Tab>LP</Tab>
            </TabList>
            <TabPanel>
              <Card className='trade-box card-in-tab'>
                <BuyPositionBox
                  searchIndexCache={searchIndexCache}
                  showAllPool={showAllPool}
                  isLoadingIndex={isLoadingIndex}
                  setShowAllPool={setShowAllPool}
                  inputTokenAddress={inputTokenAddress}
                  setInputTokenAddress={setInputTokenAddress}
                  outputTokenAddress={outputTokenAddress}
                  setOutputTokenAddress={setOutputTokenAddress}
                  tradeType={TRADE_TYPE.LONG}
                  tokenOutMaturity={tokenOutMaturity}
                />
              </Card>
            </TabPanel>
            <TabPanel>
              <Card className='trade-box card-in-tab'>
                {/* @ts-ignore */}
                <ErrorBoundary>
                  <BuyPositionBox
                    searchIndexCache={searchIndexCache}
                    showAllPool={showAllPool}
                    isLoadingIndex={isLoadingIndex}
                    setShowAllPool={setShowAllPool}
                    inputTokenAddress={inputTokenAddress}
                    setInputTokenAddress={setInputTokenAddress}
                    outputTokenAddress={outputTokenAddress}
                    setOutputTokenAddress={setOutputTokenAddress}
                    tradeType={TRADE_TYPE.SHORT}
                    tokenOutMaturity={tokenOutMaturity}
                  />
                </ErrorBoundary>
              </Card>
            </TabPanel>
            <TabPanel>
              <Card className='trade-box card-in-tab'>
                {/* @ts-ignore */}
                <ErrorBoundary>
                  <SwapBox
                    inputTokenAddress={inputTokenAddress}
                    setInputTokenAddress={setInputTokenAddress}
                    outputTokenAddress={outputTokenAddress}
                    setOutputTokenAddress={setOutputTokenAddress}
                    tokenOutMaturity={tokenOutMaturity}
                  />
                </ErrorBoundary>
              </Card>
            </TabPanel>
            <TabPanel>
              <Card className='trade-box card-in-tab'>
                {/* @ts-ignore */}
                <ErrorBoundary>
                  <BuyPositionBox
                    searchIndexCache={searchIndexCache}
                    showAllPool={showAllPool}
                    isLoadingIndex={isLoadingIndex}
                    setShowAllPool={setShowAllPool}
                    inputTokenAddress={inputTokenAddress}
                    setInputTokenAddress={setInputTokenAddress}
                    outputTokenAddress={outputTokenAddress}
                    setOutputTokenAddress={setOutputTokenAddress}
                    tradeType={TRADE_TYPE.LIQUIDITY}
                    tokenOutMaturity={tokenOutMaturity}
                  />
                </ErrorBoundary>
              </Card>
            </TabPanel>
          </Tabs>
        </div>
      </div>
      {/* @ts-ignore */}
      <ErrorBoundary>
        <SettingModal
          visible={visibleSettingModal}
          setVisible={setVisibleSettingModal}
        />
      </ErrorBoundary>
    </div>
  )
}
