import React from 'react'
import './style.scss'
import { SwapBox } from '../../Components/SwapBox'
import { PoolTable, PoolTableCompact } from '../../Components/PoolTable'
import { IconArrowLeft } from '../../Components/ui/Icon'
import { TextBlue } from '../../Components/ui/Text'
import { useConfigs } from '../../state/config/useConfigs'
import { Chart } from '../../Components/Chart'
import { ExpandPool } from '../../Components/PoolTable/ExpandPool'
import { useListPool } from '../../state/pools/hooks/useListPool'
import { useCurrentPool } from '../../state/currentPool/hooks/useCurrentPool'

export const Swap = () => {
  const { pools } = useListPool()
  const { poolAddress } = useCurrentPool()
  const { useHistory } = useConfigs()
  const history = useHistory()

  return (
    <div className='swap-page'>
      <div className='swap-page__head'>
        <span
          className='swap-page__head--back-btn'
          onClick={() => {
            history.push('pools')
          }}
        >
          <IconArrowLeft fill='#01A7FA' /> <TextBlue>Back</TextBlue>
        </span>
      </div>
      <div className='exposure-page__content'>
        <div className='exposure-page__content--left'>
          <Chart />
          <ExpandPool visible pool={pools[poolAddress] || {}} />
        </div>
        <div className='exposure-page__content--right'>
          <SwapBox />
          <PoolTableCompact />
        </div>
      </div>
    </div>
  )
}
