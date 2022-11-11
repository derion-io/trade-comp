import React, { useEffect } from 'react'
import './style.scss'
import { ExposureBox } from '../../Components/ExposureBox'
import { PoolTable } from '../../Components/PoolTable'
import { useCurrentPool } from '../../state/currentPool/hooks/useCurrentPool'
import { useWeb3React } from '../../state/customWeb3React/hook'
import { useConfigs } from '../../state/config/useConfigs'

export const Exposure = () => {
  const { configs } = useConfigs()
  const { account } = useWeb3React()
  const { updateCurrentPool } = useCurrentPool()
  useEffect(() => {
    updateCurrentPool(configs.addresses.pool)
  }, [account])

  return (
    <div className='exposure-page'>
      <ExposureBox />
      <PoolTable />
    </div>
  )
}
