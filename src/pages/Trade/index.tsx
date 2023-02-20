import React, { useEffect, useState } from 'react'
import './style.scss'
import { ExposureBox } from '../../Components/ExposureBox'
import { PoolTableCompact } from '../../Components/PoolTable'
import { useConfigs } from '../../state/config/useConfigs'
import { useCurrentPool } from '../../state/currentPool/hooks/useCurrentPool'
import { Chart } from '../../Components/Chart'
import { CHAINS, SWAP_TAB } from '../../utils/constant'
import { SwapBox } from '../../Components/SwapBox'
import { useWindowSize } from '../../hooks/useWindowSize'
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs'
import 'react-tabs/style/react-tabs.css'
import { Card } from '../../Components/ui/Card'
import { PoolDetailAndHistory } from '../../Components/PoolDetailAndHistory'
import { useListTokens } from '../../state/token/hook'

export const Trade = ({ tab }: {
  tab: Symbol
}) => {
  const { cToken, quoteToken, baseToken, baseId, basePrice, poolAddress } = useCurrentPool()
  const { useHistory, ddlEngine } = useConfigs()
  const { tokens } = useListTokens()
  const history = useHistory()
  const [changedIn24h, setChangedIn24h] = useState<number>(0)
  const { width } = useWindowSize()
  const isPhone = width && width < 992

  useEffect(() => {
    if (baseToken && quoteToken && cToken && ddlEngine && ddlEngine?.chainId === CHAINS.BSC) {
      ddlEngine.PRICE.get24hChangeByLog({
        baseId,
        currentPrice: basePrice,
        baseToken: tokens[baseToken],
        quoteToken: tokens[quoteToken],
        cToken
      }).then((value) => {
        setChangedIn24h(value)
      }).catch((e) => {
        console.error(e)
        ddlEngine.PRICE.get24hChange({
          baseToken: tokens[baseToken],
          cToken,
          quoteToken: tokens[quoteToken],
          currentPrice: basePrice
        })
          .then((value1) => {
            setChangedIn24h(value1)
          })
      })
    }
  }, [ddlEngine, cToken, quoteToken, baseToken])

  return (
    <div className='exposure-page'>
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
