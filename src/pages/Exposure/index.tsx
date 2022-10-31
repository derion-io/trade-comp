import React, { useEffect } from 'react'
import './style.scss'
import { ExposureBox } from '../../Components/ExposureBox'
import { PoolTable } from '../../Components/PoolTable'
import { useCurrentPool } from '../../state/currentPool/hooks/useCurrentPool'
import { useWeb3React } from '../../state/customWeb3React/hook'

export const Exposure = () => {
  const { account } = useWeb3React()
  const { updateCurrentPool } = useCurrentPool()
  useEffect(() => {
    updateCurrentPool('0xdf82efea82eb11f9f254e4b4d3f6691b0dbfb314')
  }, [account])

  return (
    <div className='exposure-page'>
      <ExposureBox />
      <PoolTable />
    </div>
  )
}
