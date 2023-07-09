import React, { useEffect, useState } from 'react'
import './style.scss'
import { useConfigs } from '../../state/config/useConfigs'
import { useCurrentPoolGroup } from '../../state/currentPool/hooks/useCurrentPoolGroup'
import { Chart } from '../../Components/Chart'
import { TRADE_TYPE } from '../../utils/constant'
import { SwapBox } from '../../Components/SwapBox'
import { useWindowSize } from '../../hooks/useWindowSize'
import { Tabs, TabPanel, TabList, Tab } from 'react-tabs'
import 'react-tabs/style/react-tabs.css'
import { Card } from '../../Components/ui/Card'
import { useResource } from '../../state/resources/hooks/useResource'
import { BuyPositionBox } from '../../Components/BuyPositionBox'
import { Positions } from '../../Components/Positions'
import { WalletHistoryTable } from '../../Components/WalletHistoryTable'
import { useSwapHistory } from '../../state/wallet/hooks/useSwapHistory'

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

export const Trade = ({ tab, pool }: {
  pool?: string,
  tab: TRADE_TYPE
}) => {
  const { chainId, useHistory } = useConfigs()
  const history = useHistory()
  const [changedIn24h, setChangedIn24h] = useState<number>(0)
  const { width } = useWindowSize()
  const { poolGroups } = useResource()
  const { updateCurrentPoolGroup } = useCurrentPoolGroup()
  const [tab2, setTab2] = useState<Symbol>(TAB_2.POSITION)
  const { formartedSwapLogs: swapTxs } = useSwapHistory()
  const [inputTokenAddress, setInputTokenAddress] = useState<string>('')
  const [outputTokenAddress, setOutputTokenAddress] = useState<string>('')

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
        updateCurrentPoolGroup(pool)
      } else if (Object.keys(poolGroups)[0]) {
        updateCurrentPoolGroup(Object.keys(poolGroups)[0])
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
            selectedIndex={tab}
            onSelect={(index) => {
              history.push(TAB_INDEX_TO_PATH[index])
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
                />
              </Card>
            </TabPanel>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
