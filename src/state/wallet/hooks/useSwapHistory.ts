import _ from 'lodash'
import { useDispatch, useSelector } from 'react-redux'
import { updateSwapTxs } from '../reducer'
import { State } from '../../types'
import { useWeb3React } from '../../customWeb3React/hook'

export const useSwapHistory = () => {
  const { swapTxs } = useSelector((state: State) => {
    return {
      swapTxs: state.wallet.swapTxs
    }
  })
  const { account } = useWeb3React()
  const dispatch = useDispatch()

  const addMultiSwapData = (swapLogs: any, account: string) => {
    /** group logs to multiSwap tx */
    const txGroup = _.groupBy(swapLogs, (log) => {
      return log.transactionHash
    })
    /** sort step in multiSwap tx */
    for (const i in txGroup) {
      txGroup[i] = txGroup[i].sort((a, b) => {
        return a.index - b.index
      })
    }
    /** sort tx */
    const multiSwapTxs = Object.values(txGroup).sort((a, b) => {
      return a[0].blockNumber - b[0].blockNumber
    })
    console.log('multiSwapTxs', multiSwapTxs)

    dispatch(updateSwapTxs({ account, txs: multiSwapTxs }))
    return multiSwapTxs
  }

  return { addMultiSwapData, swapTxs: swapTxs[account] }
}
