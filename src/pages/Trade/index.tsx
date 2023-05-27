import React, { useEffect, useState } from 'react'
import './style.scss'
import { useConfigs } from '../../state/config/useConfigs'
import { useCurrentPool } from '../../state/currentPool/hooks/useCurrentPool'
import { Chart } from '../../Components/Chart'
import { SWAP_TAB } from '../../utils/constant'
import { SwapBox } from '../../Components/SwapBox'
import { useWindowSize } from '../../hooks/useWindowSize'
import { Tabs, TabPanel, TabList, Tab } from 'react-tabs'
import 'react-tabs/style/react-tabs.css'
import { Card } from '../../Components/ui/Card'
import { useListTokens } from '../../state/token/hook'
import { useListPool } from '../../state/resources/hooks/useListPool'
import { BuyPositionBox } from '../../Components/BuyPositionBox'
import { Positions } from '../../Components/Positions'
import { WalletHistoryTable } from '../../Components/WalletHistoryTable'
import { useSwapHistory } from '../../state/wallet/hooks/useSwapHistory'

const TAB_2 = {
  POSITION: Symbol('position'),
  HISTORY: Symbol('history')
}

export const Trade = ({ tab, pool }: {
  pool?: string,
  tab: Symbol
}) => {
  const { id, TOKEN_R } = useCurrentPool()
  const { chainId, useHistory, ddlEngine } = useConfigs()
  const { tokens } = useListTokens()
  const history = useHistory()
  const [changedIn24h, setChangedIn24h] = useState<number>(0)
  const { width } = useWindowSize()
  const isPhone = width && width < 992
  const { poolGroups } = useListPool()
  const { updateCurrentPool } = useCurrentPool()
  const [tab2, setTab2] = useState<Symbol>(TAB_2.POSITION)
  const { formartedSwapLogs: swapTxs } = useSwapHistory()

  // useEffect(() => {
  //   if (tokens[baseToken] && tokens[quoteToken] && cToken && ddlEngine) {
  //     ddlEngine.PRICE.get24hChange({
  //       baseToken: tokens[baseToken],
  //       cToken,
  //       chainId: chainId.toString(),
  //       quoteToken: tokens[quoteToken],
  //       currentPrice: weiToNumber(numberToWei(basePrice), 18 + tokens[quoteToken].decimal - tokens[baseToken].decimal)
  //     }).then((value1) => {
  //       setChangedIn24h(value1)
  //     })
  //     // ddlEngine.PRICE.get24hChangeByLog({
  //     //   baseId,
  //     //   currentPrice: basePrice,
  //     //   baseToken: tokens[baseToken],
  //     //   quoteToken: tokens[quoteToken],
  //     //   cToken
  //     // }).then((value) => {
  //     //   setChangedIn24h(value)
  //     // }).catch((e) => {
  //     //   console.error(e)
  //     //   ddlEngine.PRICE.get24hChange({
  //     //     baseToken: tokens[baseToken],
  //     //     cToken,
  //     //     chainId: chainId.toString(),
  //     //     quoteToken: tokens[quoteToken],
  //     //     currentPrice: basePrice
  //     //   })
  //     //     .then((value1) => {
  //     //       setChangedIn24h(value1)
  //     //     })
  //     // })
  //   }
  // }, [chainId, tokens, ddlEngine, cToken, quoteToken, baseToken])

  useEffect(() => {
    if (poolGroups && Object.keys(poolGroups).length > 0) {
      if (pool && poolGroups[pool]) {
        updateCurrentPool(pool)
      } else if (Object.keys(poolGroups)[0]) {
        updateCurrentPool(Object.keys(poolGroups)[0])
      }
    }
  }, [chainId, poolGroups, pool])

  return (
    <div className='exposure-page'>
      <div className='exposure-page__content'>
        <div className='exposure-page__content--left'>
          <Chart changedIn24h={changedIn24h} />

          <Tabs
            selectedIndex={tab2 === TAB_2.POSITION ? 0 : 1}
            onSelect={(index) => {
              setTab2(index === 0 ? TAB_2.POSITION : TAB_2.HISTORY)
            }}
          >
            <TabList>
              <Tab>Positions</Tab>
              <Tab>Histories</Tab>
            </TabList>
            <TabPanel>
              <Card className='card-in-tab'>
                <Positions />
              </Card>
            </TabPanel>
            <TabPanel>
              <Card className='card-in-tab'>
                <WalletHistoryTable swapTxs={swapTxs} />
              </Card>
            </TabPanel>
          </Tabs>
        </div>
        <div className='exposure-page__content--right'>
          <Tabs
            selectedIndex={tab === SWAP_TAB.LONG ? 0 : tab === SWAP_TAB.SHORT ? 1 : 2}
            onSelect={(index) => {
              history.push(index === 0 ? '/long' : index === 1 ? '/short' : '/swap')
            }}
          >
            <TabList>
              <Tab>Long</Tab>
              <Tab>Short</Tab>
              <Tab>Swap</Tab>
            </TabList>
            <TabPanel>
              <Card className='trade-box card-in-tab'>
                <BuyPositionBox />
              </Card>
            </TabPanel>
            <TabPanel>
              <Card className='trade-box card-in-tab'>
                <BuyPositionBox isLong={false} />
              </Card>
            </TabPanel>
            <TabPanel>
              <Card className='trade-box card-in-tab'>
                <SwapBox />
              </Card>
            </TabPanel>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
