import React, { useEffect } from 'react'
import './style.scss'
import { SwapBox } from '../../Components/SwapBox'
import { PoolTable } from '../../Components/PoolTable'
import { useWeb3React } from '../../state/customWeb3React/hook'
import { useCurrentPool } from '../../state/currentPool/hooks/useCurrentPool'

export const Swap = () => {
  const { account } = useWeb3React()
  const { updateCurrentPool } = useCurrentPool()
  useEffect(() => {
    updateCurrentPool('0x2449bc7351976601814cf95595F3C8046Bf41e25')
  }, [account])

  return (
    <div className='swap-page'>
      <SwapBox />
      <PoolTable />
    </div>
  )
}
