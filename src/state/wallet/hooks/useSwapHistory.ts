import _ from 'lodash'
import { useDispatch, useSelector } from 'react-redux'
import { updateSwapTxs } from '../reducer'
import { State } from '../../types'
import { useWeb3React } from '../../customWeb3React/hook'
import { useMemo } from 'react'
import { useCurrentPool } from '../../currentPool/hooks/useCurrentPool'
import { PowerState } from 'powerLib/lib/index'

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
    // const multiSwapTxs = Object.values(txGroup).sort((a, b) => {
    //   return a[0].blockNumber - b[0].blockNumber
    // })
    console.log('multiSwapTxs', txGroup)

    dispatch(updateSwapTxs({ account, txs: txGroup }))
    return txGroup
  }

  return { addMultiSwapData, swapTxs: swapTxs[account] }
}

export const useSwapHistoryFormated = () => {
  const { swapTxs } = useSwapHistory()
  const { powers, states, poolAddress } = useCurrentPool()

  const result = useMemo(() => {
    try {
      if (!swapTxs || swapTxs.length === 0 || !poolAddress) return []
      const p = new PowerState({ powers: [...powers] })
      p.loadStates(states)

      // const balances = {}
      // const result = []
      // const cAmount = bn(0)
      // for (const i in swapTxs) {
      //   const steps = swapTxs[i]
      //   const cAmount = bn(0)
      //   for (const step of steps) {
      //   }
      // }

      return swapTxs
    } catch (e) {
      return []
    }
  }, [swapTxs, poolAddress, states])

  return result
}
