import React from 'react'
import { Card } from '../ui/Card'
import { ExpandPool } from '../PoolTable/ExpandPool'
import { WalletHistoryTable } from '../WalletHistoryTable'
import { useSwapHistory } from '../../state/wallet/hooks/useSwapHistory'
import { useListPool } from '../../state/pools/hooks/useListPool'
import './style.scss'
import isEqual from 'react-fast-compare'

export const Component = ({ poolAddress }: {poolAddress: string}) => {
  const { formartedSwapLogs: swapTxs } = useSwapHistory()
  const { pools } = useListPool()

  return <Card className='pool-detail-and-history'>
    <div className='pool-detail-and-history__left'>
      <ExpandPool visible pool={pools[poolAddress] || {}} />
    </div>
    <div className='pool-detail-and-history__right'>
      <WalletHistoryTable swapTxs={swapTxs}/>
    </div>
  </Card>
}

export const PoolDetailAndHistory = React.memo(Component, (prevProps, nextProps) =>
  isEqual(prevProps, nextProps)
)
