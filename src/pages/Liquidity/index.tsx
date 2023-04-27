import React, { useEffect, useState } from 'react'
import './style.scss'
import { PoolTableCompact } from '../../Components/PoolTable'
import { TextBlue } from '../../Components/ui/Text'
import { IconArrowLeft } from '../../Components/ui/Icon'
import { useConfigs } from '../../state/config/useConfigs'
import { useCurrentPool } from '../../state/currentPool/hooks/useCurrentPool'
import { LIQUIDITY_TAB, POOL_IDS } from '../../utils/constant'
import { useWindowSize } from '../../hooks/useWindowSize'
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs'
import 'react-tabs/style/react-tabs.css'
import { Card } from '../../Components/ui/Card'
import { PoolDetailAndHistory } from '../../Components/PoolDetailAndHistory'
import { AddLiquidityBox } from './components/AddLiquidityBox'
import { RemoveLiquidityBox } from './components/RemoveLiquidityBox'
import { BigNumber } from 'ethers'
import { bn } from '../../utils/helpers'
import { useContract } from '../../hooks/useContract'

export const Liquidity = ({ tab }: {
  tab: Symbol
}) => {
  // const { poolAddress } = useCurrentPool()
  const { useHistory } = useConfigs()
  const history = useHistory()
  const { width } = useWindowSize()
  const isPhone = width && width < 992
  const [totalSupplyCP, setTotalSupplyCP] = useState<BigNumber>(bn(0))
  const { getPoolContract } = useContract()

  // useEffect(() => {
  //   const fetchTotalSyupply = async () => {
  //     const contract = getPoolContract(poolAddress)
  //     const res = await contract.totalSupply(POOL_IDS.cp)
  //     setTotalSupplyCP(res)
  //   }
  //   fetchTotalSyupply()
  // }, [poolAddress])

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
          {
            !isPhone && <div className='hidden-on-phone'>
              {/*<PoolDetailAndHistory poolAddress={poolAddress}/>*/}
            </div>
          }
        </div>
        <div className='exposure-page__content--right'>
          <Tabs
            selectedIndex={tab === LIQUIDITY_TAB.ADD ? 0 : 1}
            onSelect={(index) => {
              history.push(index === 0 ? '/add-liquidity' : '/remove-liquidity')
            }}
          >
            <TabList>
              <Tab>Add</Tab>
              <Tab>Remove</Tab>
            </TabList>
            <TabPanel>
              <Card className='trade-box card-in-tab'>
                <AddLiquidityBox totalSupplyCP={totalSupplyCP} />
              </Card>
            </TabPanel>
            <TabPanel>
              <Card className='trade-box card-in-tab'>
                <RemoveLiquidityBox totalSupplyCP={totalSupplyCP} />
              </Card>
            </TabPanel>
          </Tabs>
          <Card>
            <PoolTableCompact />
          </Card>
          {
            isPhone && <div className='hidden-on-desktop'>
              {/*<PoolDetailAndHistory poolAddress={poolAddress}/>*/}
            </div>
          }
        </div>
      </div>
    </div>
  )
}
