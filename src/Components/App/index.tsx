import React from 'react'
import './style.scss'
import { SwapBox } from '../SwapBox'
import { PoolTable } from '../PoolTable'

export const App = () => {
  return (
    <div className='exposure-interface app'>
      <SwapBox />
      <PoolTable/>
    </div>
  )
}
