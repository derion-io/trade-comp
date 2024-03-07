import { useDispatch, useSelector } from 'react-redux'
import { updatePendingSwapTxs } from '../reducer'
import { State } from '../../types'
import { SwapPendingTxType } from '../type'
import { useWeb3React } from '../../customWeb3React/hook'

export const useSwapPendingHistory = () => {
  const { account } = useWeb3React()
  const { swapPendingTxs } = useSelector((state: State) => {
    return {
      swapPendingTxs: state.wallet.mapAccounts[account]?.swapPendingTxs || []
    }
  })
  const dispatch = useDispatch()
  const updatePendingTxsHandle = (account: string, swapPendingTx: SwapPendingTxType[]) => {
    dispatch(updatePendingSwapTxs({
      account,
      swapPendingTx
    }))
  }
  return {
    swapPendingTxs,
    updatePendingTxsHandle
  }
}
