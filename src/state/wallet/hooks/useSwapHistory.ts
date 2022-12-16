import _ from 'lodash'
import { useDispatch, useSelector } from 'react-redux'
import { updateSwapTxs } from '../reducer'
import { State } from '../../types'
import { useWeb3React } from '../../customWeb3React/hook'
import { useMemo } from 'react'
import { useCurrentPool } from '../../currentPool/hooks/useCurrentPool'
import { PowerState } from 'powerLib/lib/index'
import { bn } from '../../../utils/helpers'
import { POOL_IDS } from '../../../utils/constant'

export const useSwapHistory = () => {
  const { swapLogs } = useSelector((state: State) => {
    return {
      swapLogs: state.wallet.swapLogs
    }
  })
  const { account } = useWeb3React()
  const dispatch = useDispatch()

  const addMultiSwapData = (swapLogs: any, account: string) => {
    console.log({
      account, txs: swapLogs
    })
    dispatch(updateSwapTxs({ account, swapLogs }))
  }

  return { addMultiSwapData, swapLogs: swapLogs[account] }
}

export const useSwapHistoryFormated = () => {
  const { swapLogs } = useSwapHistory()
  const { powers, states, poolAddress } = useCurrentPool()

  const result = useMemo(() => {
    try {
      if (!swapLogs || swapLogs.length === 0 || !poolAddress) return []
      const p = new PowerState({ powers: [...powers] })
      p.loadStates(states)

      const result = []
      const balances = {}
      for (const swapLog of swapLogs) {
        if (swapLog.args.pool !== poolAddress) continue

        const steps = swapLog.args.steps
        let cAmount = bn(0)
        const oldLeverage = p.calculateCompExposure(balances)

        for (const step of steps) {
          if (step.idIn.eq(bn(POOL_IDS.cToken))) {
            cAmount = cAmount.add(step.amountIn)
          } else if (step.idOut.eq(bn(POOL_IDS.cToken))) {
            cAmount = cAmount.sub(step.amountIn)
          }

          if (powers[step.idIn]) {
            balances[powers[step.idIn]] = balances[powers[step.idIn]] ? balances[powers[step.idIn]].sub(step.amountIn) : bn(0).sub(step.amountIn)
          }

          if (powers[step.idOut]) {
            balances[powers[step.idOut]] = balances[powers[step.idIn]] ? balances[powers[step.idIn]].add(step.amountIn) : bn(0).add(step.amountIn)
          }
        }
        const newLeverage = p.calculateCompExposure(balances)
        result.push({
          timeStamp: swapLog.timeStamp,
          balances,
          cAmount,
          newLeverage,
          oldLeverage
        })
      }

      return result
    } catch (e) {
      console.error(e)
      return []
    }
  }, [swapLogs, poolAddress, states])

  return result
}
