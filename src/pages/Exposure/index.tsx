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
    updateCurrentPool('0x2449bc7351976601814cf95595F3C8046Bf41e25')
  }, [account])

  return (
    <div className='exposure-page'>
      <ExposureBox />
      <PoolTable />
    </div>
  )
}
