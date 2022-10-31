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
    updateCurrentPool('0xdf82efea82eb11f9f254e4b4d3f6691b0dbfb314')
  }, [account])

  return (
    <div className='swap-page'>
      <SwapBox />
      <PoolTable />
    </div>
  )
}
