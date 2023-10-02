import { useDispatch, useSelector } from 'react-redux'
import { updateFormatedSwapTxs, updateSwapTxs } from '../reducer'
import { State } from '../../types'
import { useWeb3React } from '../../customWeb3React/hook'
import { useEffect } from 'react'
import { useCurrentPoolGroup } from '../../currentPool/hooks/useCurrentPoolGroup'
import { useConfigs } from '../../config/useConfigs'
import _ from 'lodash'
import { useResource } from '../../resources/hooks/useResource'
import { useListTokens } from '../../token/hook'

export const useSwapHistory = () => {
  const { swapLogs, transferLogs, formartedSwapLogs } = useSelector((state: State) => {
    return {
      swapLogs: state.wallet.swapLogs,
      transferLogs: state.wallet.transferLogs,
      formartedSwapLogs: state.wallet.formartedSwapLogs
    }
  })
  const { account } = useWeb3React()
  const dispatch = useDispatch()

  const updateSwapTxsHandle = (account: string, _swapLogs: any, _transferLogs: any) => {
    dispatch(updateSwapTxs({ account, swapLogs: _.cloneDeep(_swapLogs), transferLogs: _.cloneDeep(_transferLogs) }))
  }

  return {
    updateSwapTxsHandle,
    swapLogs: swapLogs[account],
    transferLogs: transferLogs[account],
    formartedSwapLogs
  }
}

export const useSwapHistoryFormated = () => {
  const { swapLogs, transferLogs } = useSwapHistory()
  const { id } = useCurrentPoolGroup()
  const { ddlEngine } = useConfigs()
  const dispatch = useDispatch()
  const { pools } = useResource()
  const { tokens } = useListTokens()
  const { account } = useWeb3React()

  useEffect(() => {
    if (
      pools &&
      Object.values(pools).length > 0 &&
      ddlEngine?.CURRENT_POOL.pools &&
      id &&
      Object.values(tokens).length > 0
    ) {
      const swapTxs = ddlEngine?.HISTORY.formatSwapHistory({
        tokens: Object.values(tokens),
        transferLogs: transferLogs,
        swapLogs
      })
      dispatch(updateFormatedSwapTxs({ swapTxs }))
    }
    if (!account) {
      dispatch(updateFormatedSwapTxs({ swapTxs: [] }))
    }
  }, [swapLogs, transferLogs, pools, ddlEngine?.CURRENT_POOL, id, tokens, account])
}
