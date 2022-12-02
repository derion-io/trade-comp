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

export const Exposure = ({ tab }: {
  tab: Symbol
}) => {
  const { cToken, quoteToken, baseToken, poolAddress } = useCurrentPool()
  const { pools } = useListPool()
  const { useHistory } = useConfigs()
  const history = useHistory()
  const { get24hChange } = useHelper()
  const [changedIn24h, setChangedIn24h] = useState<number>(0)
  const { width } = useWindowSize()
  const isPhone = width && width < 992

  useEffect(() => {
    if (baseToken && quoteToken && cToken) {
      get24hChange(baseToken, cToken, quoteToken).then((value) => {
        setChangedIn24h(value)
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
            <div className='hidden-on-phone'>
              <ExpandPool visible pool={pools[poolAddress] || {}} />
            </div>
          }
        </div>
        <div className='exposure-page__content--right'>
          {
            tab === SWAP_TAB.EXPOSURE
              ? <ExposureBox changedIn24h={changedIn24h}/>
              : <SwapBox />
          }
          <PoolTableCompact />
          {
            isPhone && <div className='hidden-on-desktop'><ExpandPool visible pool={pools[poolAddress] || {}} /></div>
          }
        </div>
      </div>
    </div>
  )
}
