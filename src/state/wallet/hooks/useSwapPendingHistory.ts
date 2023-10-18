import { useDispatch, useSelector } from 'react-redux'
import { updatePendingSwapTxs } from '../reducer'
import { State } from '../../types'
import { SwapPendingTxType } from '../type'

export const useSwapPendingHistory = () => {
  const { swapPendingTxs } = useSelector((state: State) => {
    return {
      swapPendingTxs: state.wallet.swapPendingTxs
    }
  })
  const dispatch = useDispatch()
  const updatePendingTxsHandle = (pendingTxs: SwapPendingTxType[]) => {
    dispatch(updatePendingSwapTxs(pendingTxs))
  }
  return {
    swapPendingTxs,
    updatePendingTxsHandle
  }
}
