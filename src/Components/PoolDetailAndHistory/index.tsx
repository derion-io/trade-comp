import React from 'react'
import { Card } from '../ui/Card'
import { ExpandPool } from '../PoolTable/ExpandPool'
import { WalletHistoryTable } from '../WalletHistoryTable'
import { useSwapHistory } from '../../state/wallet/hooks/useSwapHistory'
import { useListPool } from '../../state/pools/hooks/useListPool'
import './style.scss'

export const PoolDetailAndHistory = ({ poolAddress }: {poolAddress: string}) => {
  const { formartedSwapLogs: swapTxs } = useSwapHistory()
  const { pools } = useListPool()

  return <Card className='pool-detail-and-history'>
    <ExpandPool visible pool={pools[poolAddress] || {}} />
    <WalletHistoryTable swapTxs={swapTxs}/>
  </Card>
}
