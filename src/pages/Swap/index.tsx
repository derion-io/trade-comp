import React from 'react'
import './style.scss'
import { SwapBox } from '../../Components/SwapBox'
import { PoolTable } from '../../Components/PoolTable'

export const Swap = () => {
  return (
    <div className='swap-page'>
      <SwapBox />
      <PoolTable />
    </div>
  )
}
