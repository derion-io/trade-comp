import React, { useEffect, useState } from 'react'
import './style.scss'
import { ExposureBox } from '../../Components/ExposureBox'
import { PoolTableCompact } from '../../Components/PoolTable'
import { useConfigs } from '../../state/config/useConfigs'
import { useCurrentPool } from '../../state/currentPool/hooks/useCurrentPool'
import { Chart } from '../../Components/Chart'
import { SWAP_TAB } from '../../utils/constant'
import { SwapBox } from '../../Components/SwapBox'
import { useWindowSize } from '../../hooks/useWindowSize'
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs'
import 'react-tabs/style/react-tabs.css'
import { Card } from '../../Components/ui/Card'
import { PoolDetailAndHistory } from '../../Components/PoolDetailAndHistory'
import { useListTokens } from '../../state/token/hook'
import { numberToWei, weiToNumber } from '../../utils/helpers'
import coingecko from '../../assets/abi/coingecko.json'
// import fetch from 'fetch'

export const Trade = ({ tab }: {
  tab: Symbol
}) => {
  const { cToken, quoteToken, baseToken, baseId, basePrice, poolAddress } = useCurrentPool()
  const { chainId, useHistory, ddlEngine } = useConfigs()
  const { tokens } = useListTokens()
  const history = useHistory()
  const [changedIn24h, setChangedIn24h] = useState<number>(0)
  const { width } = useWindowSize()
  const isPhone = width && width < 992

  useEffect(() => {
    if (tokens[baseToken] && tokens[quoteToken] && cToken && ddlEngine) {
      getChangedIn24h(tokens[baseToken], tokens[quoteToken])
      // ddlEngine.PRICE.get24hChange({
      //   baseToken: tokens[baseToken],
      //   cToken,
      //   chainId: chainId.toString(),
      //   quoteToken: tokens[quoteToken],
      //   currentPrice: weiToNumber(numberToWei(basePrice), 18 + tokens[quoteToken].decimal - tokens[baseToken].decimal)
      // }).then((value1) => {
      //   setChangedIn24h(value1)
      // })
      // console.log('khanh', tokens[baseToken], tokens[quoteToken])
      // ddlEngine.PRICE.get24hChangeByLog({
      //   baseId,
      //   currentPrice: basePrice,
      //   baseToken: tokens[baseToken],
      //   quoteToken: tokens[quoteToken],
      //   cToken
      // }).then((value) => {
      //   setChangedIn24h(value)
      // }).catch((e) => {
      //   console.error(e)
      //   ddlEngine.PRICE.get24hChange({
      //     baseToken: tokens[baseToken],
      //     cToken,
      //     chainId: chainId.toString(),
      //     quoteToken: tokens[quoteToken],
      //     currentPrice: basePrice
      //   })
      //     .then((value1) => {
      //       setChangedIn24h(value1)
      //     })
      // })
    }
  }, [chainId, tokens, ddlEngine, cToken, quoteToken, baseToken])

    async function getChangedIn24h(token0: any, token1: any) {
      let id0, id1
      for (let i = 0; i < coingecko.length; i++) {
        let platforms = Object.values(coingecko[i].platforms)
        for ( let j = 0; j < platforms.length; j++) {
          if (token0.address.toLowerCase() == Object.values(coingecko[i].platforms)[j]) {
            id0 = coingecko[i].id
          }
          if (token1.address.toLowerCase() == Object.values(coingecko[i].platforms)[j]) {
            id1 = coingecko[i].id
          }
        }
      }
      if (!id0 || !id1) {
          setChangedIn24h(0)
          return
      }
      let url = `https://api.coingecko.com/api/v3/simple/price?ids=${id0},${id1}&vs_currencies=USD&include_24hr_change=true`
      fetch(url)
        .then((response) => response.json())
        .then((data) => {
          let arr: any = Object.values(data)
          let priceNow = arr[1].usd/arr[0].usd
          let price24h = (arr[1].usd/(arr[1].usd_24h_change+100)*100)/(arr[0].usd/(arr[0].usd_24h_change+100)*100)
          const result: any = ((priceNow-price24h)/price24h)*100
          setChangedIn24h(result.toFixed(2))
        })
    }

  return (
    <div className='exposure-page'>
      <div className='exposure-page__content'>
        <div className='exposure-page__content--left'>
          <Chart changedIn24h={changedIn24h} />
          {
            !isPhone && <div className='hidden-on-phone'>
              <PoolDetailAndHistory poolAddress={poolAddress} />
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
                <ExposureBox changedIn24h={changedIn24h} />
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
              <PoolDetailAndHistory poolAddress={poolAddress} />
            </div>
          }
        </div>
      </div>
    </div>
  )
}
