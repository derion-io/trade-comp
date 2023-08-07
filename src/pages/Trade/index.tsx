import React, { useEffect, useState } from 'react'
import './style.scss'
import { useConfigs } from '../../state/config/useConfigs'
import { useCurrentPoolGroup } from '../../state/currentPool/hooks/useCurrentPoolGroup'
import { Chart } from '../../Components/Chart'
import { POOL_IDS, TRADE_TYPE } from '../../utils/constant'
import { SwapBox } from '../../Components/SwapBox'
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs'
import 'react-tabs/style/react-tabs.css'
import { Card } from '../../Components/ui/Card'
import { useResource } from '../../state/resources/hooks/useResource'
import { BuyPositionBox } from '../../Components/BuyPositionBox'
import { Positions } from '../../Components/Positions'
import { WalletHistoryTable } from '../../Components/WalletHistoryTable'
import { useSwapHistory } from '../../state/wallet/hooks/useSwapHistory'
import { SettingIcon } from '../../Components/ui/Icon'
import { SettingModal } from '../../Components/SettingModal'
import { useListTokens } from '../../state/token/hook'
import { useWalletBalance } from '../../state/wallet/hooks/useBalances'
import { bn, decodeErc1155Address, isErc1155Address } from '../../utils/helpers'

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

export const Trade = ({ tab }: {
  tab: TRADE_TYPE
}) => {
  const { chainId, useHistory, ddlEngine } = useConfigs()
  const history = useHistory()
  const [changedIn24h, setChangedIn24h] = useState<number>(0)
  const { poolGroups } = useResource()
  const { updateCurrentPoolGroup, id, baseToken, quoteToken, basePrice } = useCurrentPoolGroup()
  const [tab2, setTab2] = useState<Symbol>(TAB_2.POSITION)
  const { formartedSwapLogs: swapTxs } = useSwapHistory()
  const [inputTokenAddress, setInputTokenAddress] = useState<string>('')
  const [outputTokenAddress, setOutputTokenAddress] = useState<string>('')
  const [visibleSettingModal, setVisibleSettingModal] = useState<boolean>(false)
  const { tokens } = useListTokens()
  const { maturities } = useWalletBalance()
  const tokenOutMaturity = maturities[outputTokenAddress] || bn(0)

  useEffect(() => {
    const url = location.href.split('?').length > 1 ? `${SIMULATE_URL}?${location.href.split('?')[1]}` : SIMULATE_URL
    const urlSearchParams = new URL(url).searchParams
    if (id) {
      urlSearchParams.set('index', id)
    }
    if (outputTokenAddress && isErc1155Address(outputTokenAddress)) {
      urlSearchParams.set('pool', decodeErc1155Address(outputTokenAddress).address)
    }

    history.push({
      search: '?' + urlSearchParams.toString()
    })
  }, [outputTokenAddress, id])

  useEffect(() => {
    if (tokens[baseToken] && tokens[quoteToken] && id && ddlEngine && basePrice) {
      ddlEngine.PRICE.get24hChange({
        baseToken: tokens[baseToken],
        cToken: id,
        chainId: chainId.toString(),
        quoteToken: tokens[quoteToken],
        currentPrice: basePrice.toString()
      }).then((value1) => {
        setChangedIn24h(Number(value1))
      })
    }
  }, [chainId, tokens, ddlEngine, id, quoteToken, baseToken, basePrice])

  useEffect(() => {
    if (poolGroups && Object.keys(poolGroups).length > 0) {
      const url = location.href
      const urlSearchParams = new URL(`https://1.com?${url.split('?')[1]}`).searchParams
      const index = urlSearchParams.get('index')
      const pool = urlSearchParams.get('pool')

      if (index && poolGroups[index]) {
        updateCurrentPoolGroup(index)

        if (pool && poolGroups[index].pools[pool]) {
          if (tab === TRADE_TYPE.LONG) {
            setOutputTokenAddress(pool + '-' + POOL_IDS.A)
          } else if (tab === TRADE_TYPE.SHORT) {
            setOutputTokenAddress(pool + '-' + POOL_IDS.B)
          } else if (tab === TRADE_TYPE.LIQUIDITY) {
            setOutputTokenAddress(pool + '-' + POOL_IDS.C)
          }
        }
      } else if (Object.keys(poolGroups)[0] && !id) {
        updateCurrentPoolGroup(Object.keys(poolGroups)[0])
      }
    }
  }, [chainId, poolGroups])

  return (
    <div className='exposure-page'>
      <div className='exposure-page__content'>
        {/* <div className='exposure-page__content--left'> */}
        <Chart changedIn24h={changedIn24h} />
        <Tabs
          className='exposure-page__content--position-and-history'
          selectedIndex={tab2 === TAB_2.POSITION ? 0 : 1}
          onSelect={(index) => {
            setTab2(index === 0 ? TAB_2.POSITION : TAB_2.HISTORY)
          }}
        >
          <TabList>
            <Tab>Position</Tab>
            <Tab>History</Tab>
          </TabList>
          <TabPanel>
            <Card className='card-in-tab'>
              <Positions
                setOutputTokenAddressToBuy={setOutputTokenAddress}
                tokenOutMaturity={tokenOutMaturity}
              />
            </Card>
          </TabPanel>
          <TabPanel>
            <Card className='card-in-tab'>
              <WalletHistoryTable swapTxs={swapTxs} />
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
            <SettingIcon style={{
              float: 'right',
              margin: '0.4rem'
            }} />
          </div>
          <Tabs
            selectedIndex={tab}
            onSelect={(index) => {
              history.push({
                pathname: TAB_INDEX_TO_PATH[index],
                search: location.href.split('?').length > 1 ? `?${location.href.split('?')[1]}` : ''
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
                <BuyPositionBox
                  inputTokenAddress={inputTokenAddress}
                  setInputTokenAddress={setInputTokenAddress}
                  outputTokenAddress={outputTokenAddress}
                  setOutputTokenAddress={setOutputTokenAddress}
                  tradeType={TRADE_TYPE.SHORT}
                  tokenOutMaturity={tokenOutMaturity}
                />
              </Card>
            </TabPanel>
            <TabPanel>
              <Card className='trade-box card-in-tab'>
                <SwapBox
                  inputTokenAddress={inputTokenAddress}
                  setInputTokenAddress={setInputTokenAddress}
                  outputTokenAddress={outputTokenAddress}
                  setOutputTokenAddress={setOutputTokenAddress}
                  tokenOutMaturity={tokenOutMaturity}
                />
              </Card>
            </TabPanel>
            <TabPanel>
              <Card className='trade-box card-in-tab'>
                <BuyPositionBox
                  inputTokenAddress={inputTokenAddress}
                  setInputTokenAddress={setInputTokenAddress}
                  outputTokenAddress={outputTokenAddress}
                  setOutputTokenAddress={setOutputTokenAddress}
                  tradeType={TRADE_TYPE.LIQUIDITY}
                  tokenOutMaturity={tokenOutMaturity}

                />
              </Card>
            </TabPanel>
          </Tabs>
        </div>
      </div>
      <SettingModal
        visible={visibleSettingModal}
        setVisible={setVisibleSettingModal}
      />
    </div>
  )
}
