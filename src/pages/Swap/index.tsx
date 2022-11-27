import React from 'react'
import './style.scss'
import { SwapBox } from '../../Components/SwapBox'
import { PoolTable } from '../../Components/PoolTable'
import { IconArrowLeft } from '../../Components/ui/Icon'
import { TextBlue } from '../../Components/ui/Text'
import { useConfigs } from '../../state/config/useConfigs'

export const Swap = () => {
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
      <div className='swap-page__content'>
        <SwapBox />
        <PoolTable />
      </div>
    </div>
  )
}
