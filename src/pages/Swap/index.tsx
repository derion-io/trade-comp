import React, { useEffect } from 'react'
import './style.scss'
import { SwapBox } from '../../Components/SwapBox'
import { PoolTable } from '../../Components/PoolTable'
import { useWeb3React } from '../../state/customWeb3React/hook'
import { useCurrentPool } from '../../state/currentPool/hooks/useCurrentPool'
import { useConfigs } from '../../state/config/useConfigs'

export const Swap = () => {
  const { account } = useWeb3React()
  const { updateCurrentPool } = useCurrentPool()
  const { configs } = useConfigs()
  useEffect(() => {
    updateCurrentPool(configs.addresses.pool)
  }, [account])

  return (
    <div className='swap-page'>
      <SwapBox />
      <PoolTable />
    </div>
  )
}
