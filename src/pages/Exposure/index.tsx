import React from 'react'
import './style.scss'
import { ExposureBox } from '../../Components/ExposureBox'
import { PoolTable } from '../../Components/PoolTable'

export const Exposure = () => {
  return (
    <div className='exposure-page'>
      <ExposureBox />
      <PoolTable />
    </div>
  )
}
