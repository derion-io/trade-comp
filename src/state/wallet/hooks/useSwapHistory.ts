import { useDispatch, useSelector } from 'react-redux'
import { updateFormatedSwapTxs, updateSwapTxs } from '../reducer'
import { State } from '../../types'
import { useWeb3React } from '../../customWeb3React/hook'
import { useEffect } from 'react'
import { useCurrentPool } from '../../currentPool/hooks/useCurrentPool'
import { useConfigs } from '../../config/useConfigs'

export const useSwapHistory = () => {
  const { swapLogs, formartedSwapLogs } = useSelector((state: State) => {
    return {
      swapLogs: state.wallet.swapLogs,
      formartedSwapLogs: state.wallet.formartedSwapLogs
    }
  })
  const { account } = useWeb3React()
  const dispatch = useDispatch()

  const addMultiSwapData = (swapLogs: any, account: string) => {
    dispatch(updateSwapTxs({ account, swapLogs }))
  }

  return {
    addMultiSwapData,
    swapLogs: swapLogs[account],
    formartedSwapLogs
  }
}

export const useSwapHistoryFormated = () => {
  const { swapLogs: sls } = useSwapHistory()
  const { powers, states, poolAddress } = useCurrentPool()
  const { ddlEngine } = useConfigs()
  const dispatch = useDispatch()

  useEffect(() => {
    if (ddlEngine?.CURRENT_POOL.poolAddress) {
      const swapTxs = ddlEngine?.HISTORY.formatSwapHistory({
        logs: sls,
        poolAddress: poolAddress,
        states: states,
        powers: powers
      })
      dispatch(updateFormatedSwapTxs({ swapTxs }))
    }
  }, [sls, ddlEngine?.CURRENT_POOL, states])
}
