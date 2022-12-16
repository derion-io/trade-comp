import React, { useEffect, useMemo, useState } from 'react'
import './style.scss'
import { ExposureBox } from '../../Components/ExposureBox'
import { PoolTable, PoolTableCompact } from '../../Components/PoolTable'
import { TextBlue } from '../../Components/ui/Text'
import { IconArrowLeft } from '../../Components/ui/Icon'
import { useConfigs } from '../../state/config/useConfigs'
import { useCurrentPool } from '../../state/currentPool/hooks/useCurrentPool'
import { useHelper } from '../../state/config/useHelper'
import { ExpandPool } from '../../Components/PoolTable/ExpandPool'
import { useListPool } from '../../state/pools/hooks/useListPool'
import { Chart } from '../../Components/Chart'
import { SWAP_TAB } from '../../utils/constant'
import { SwapBox } from '../../Components/SwapBox'
import { useWindowSize } from '../../hooks/useWindowSize'
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs'
import 'react-tabs/style/react-tabs.css'
import { Card } from '../../Components/ui/Card'
import { useSwapHistoryFormated } from '../../state/wallet/hooks/useSwapHistory'
import { WalletHistoryTable } from '../../Components/WalletHistoryTable'

export const Exposure = ({ tab }: {
  tab: Symbol
}) => {
  const { cToken, quoteToken, baseToken, baseId, basePrice, poolAddress } = useCurrentPool()
  const { pools } = useListPool()
  const { useHistory } = useConfigs()
  const history = useHistory()
  const { get24hChange, get24hChangeByLog } = useHelper()
  const [changedIn24h, setChangedIn24h] = useState<number>(0)
  const { width } = useWindowSize()
  const isPhone = width && width < 992
  const swapTxs = useSwapHistoryFormated()
  useEffect(() => {
    console.log('final', swapTxs)
  }, [swapTxs])

  useEffect(() => {
    if (baseToken && quoteToken && cToken) {
      get24hChangeByLog({
        baseId,
        currentPrice: basePrice,
        baseToken,
        quoteToken,
        cToken
      }).then((value) => {
        if (value) {
          setChangedIn24h(value)
        } else {
          get24hChange(baseToken, cToken, quoteToken)
            .then((value1) => {
              setChangedIn24h(value1)
            })
        }
      })
    }
  }, [cToken, quoteToken, baseToken])

  return (
    <div className='exposure-page'>
      <div className='exposure-page__head'>
        <div
          className='exposure-page__head--back-btn'
          onClick={() => {
            history.push('pools')
          }}
        >
          <IconArrowLeft fill='#01A7FA' /> <TextBlue>Back</TextBlue>
        </div>
      </div>
      <div className='exposure-page__content'>
        <div className='exposure-page__content--left'>
          <Chart />
          {
            !isPhone &&
            <Tabs>
              <TabList>
                <Tab>Pool Info</Tab>
                <Tab>History</Tab>
              </TabList>
              <TabPanel>
                <Card className='hidden-on-phone card-in-tab'>
                  <ExpandPool visible pool={pools[poolAddress] || {}} />
                </Card>
              </TabPanel>
              <TabPanel>
                <Card className='hidden-on-phone card-in-tab'>
                  <WalletHistoryTable swapTxs={swapTxs}/>
                </Card>
              </TabPanel>
            </Tabs>
          }
        </div>
        <div className='exposure-page__content--right'>
          <Tabs
            selectedIndex={tab === SWAP_TAB.EXPOSURE ? 0 : 1}
            onSelect={(index) => {
              history.push(index === 0 ? '/trade/exposure' : '/trade/swap')
            }}
          >
            <TabList>
              <Tab>Exposure</Tab>
              <Tab>Swap</Tab>
            </TabList>
            <TabPanel>
              <Card className='trade-box card-in-tab'>
                <ExposureBox changedIn24h={changedIn24h}/>
              </Card>
            </TabPanel>
            <TabPanel>
              <Card className='trade-box card-in-tab'>
                <SwapBox />
              </Card>
            </TabPanel>
          </Tabs>
          <Card>
            <PoolTableCompact />
          </Card>
          {
            isPhone && <div className='hidden-on-desktop'><ExpandPool visible pool={pools[poolAddress] || {}} /></div>
          }
        </div>
      </div>
    </div>
  )
}
