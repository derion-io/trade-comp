import { useDispatch, useSelector } from 'react-redux'
import { updateFormatedSwapTxs, updateSwapTxs } from '../reducer'
import { State } from '../../types'
import { useWeb3React } from '../../customWeb3React/hook'
import { useEffect } from 'react'
import { useCurrentPool } from '../../currentPool/hooks/useCurrentPool'
import { useConfigs } from '../../config/useConfigs'
import _ from 'lodash'
import { useListPool } from '../../resources/hooks/useListPool'

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

  const updateSwapTxsHandle = (account: string, data: any) => {
    dispatch(updateSwapTxs({ account, swapLogs: _.cloneDeep(data) }))
  }

  return {
    updateSwapTxsHandle,
    addMultiSwapData,
    swapLogs: swapLogs[account],
    formartedSwapLogs
  }
}

export const useSwapHistoryFormated = () => {
  const { swapLogs: sls } = useSwapHistory()
  const { states, id } = useCurrentPool()
  const { ddlEngine } = useConfigs()
  const dispatch = useDispatch()
  const { pools } = useListPool()

  useEffect(() => {
    console.log(pools, ddlEngine?.CURRENT_POOL.TOKEN)
    if (Object.values(pools).length > 0 && id) {
      const swapTxs = ddlEngine?.HISTORY.formatSwapHistory({
        logs: sls
      })
      console.log('swapTxs', swapTxs)
      dispatch(updateFormatedSwapTxs({ swapTxs }))
    }
  }, [sls, pools, ddlEngine?.CURRENT_POOL, id, states])
}
