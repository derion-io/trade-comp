import React, { useEffect, useState } from 'react'
import './style.scss'
import { ExposureBox } from '../../Components/ExposureBox'
import { PoolTableCompact } from '../../Components/PoolTable'
import { TextBlue } from '../../Components/ui/Text'
import { IconArrowLeft } from '../../Components/ui/Icon'
import { useConfigs } from '../../state/config/useConfigs'
import { useCurrentPool } from '../../state/currentPool/hooks/useCurrentPool'
import { useHelper } from '../../state/config/useHelper'
import { Chart } from '../../Components/Chart'
import { SWAP_TAB } from '../../utils/constant'
import { SwapBox } from '../../Components/SwapBox'
import { useWindowSize } from '../../hooks/useWindowSize'
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs'
import 'react-tabs/style/react-tabs.css'
import { Card } from '../../Components/ui/Card'
import { PoolDetailAndHistory } from '../../Components/PoolDetailAndHistory'

export const Trade = ({ tab }: {
  tab: Symbol
}) => {
  const { cToken, quoteToken, baseToken, baseId, basePrice, poolAddress } = useCurrentPool()
  const { useHistory } = useConfigs()
  const history = useHistory()
  const { get24hChange, get24hChangeByLog } = useHelper()
  const [changedIn24h, setChangedIn24h] = useState<number>(0)
  const { width } = useWindowSize()
  const isPhone = width && width < 992

  useEffect(() => {
    if (baseToken && quoteToken && cToken) {
      get24hChangeByLog({
        baseId,
        currentPrice: basePrice,
        baseToken,
        quoteToken,
        cToken
      }).then((value) => {
        setChangedIn24h(value)
      }).catch((e) => {
        console.error(e)
        get24hChange(baseToken, cToken, quoteToken, basePrice)
          .then((value1) => {
            setChangedIn24h(value1)
          })
      })
    }
  }, [cToken, quoteToken, baseToken])

  // const poolInfoAndHistory = <Tabs>
  //   <TabList>
  //     <Tab>Pool Info</Tab>
  //     <Tab>History</Tab>
  //   </TabList>
  //   <TabPanel>
  //     <Card className='card-in-tab'>
  //       <ExpandPool visible pool={pools[poolAddress] || {}} />
  //     </Card>
  //   </TabPanel>
  //   <TabPanel>
  //     <Card className='card-in-tab'>
  //       <WalletHistoryTable swapTxs={swapTxs}/>
  //     </Card>
  //   </TabPanel>
  // </Tabs>

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
          <Chart changedIn24h={changedIn24h}/>
          {
            !isPhone && <div className='hidden-on-phone'>
              <PoolDetailAndHistory poolAddress={poolAddress}/>
            </div>
          }
        </div>
        <div className='exposure-page__content--right'>
          <Tabs
            selectedIndex={tab === SWAP_TAB.EXPOSURE ? 0 : 1}
            onSelect={(index) => {
              history.push(index === 0 ? '/exposure' : '/swap')
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
            isPhone && <div className='hidden-on-desktop'>
              <PoolDetailAndHistory poolAddress={poolAddress}/>
            </div>
          }
        </div>
      </div>
    </div>
  )
}
