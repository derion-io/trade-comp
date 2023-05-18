import { useConfigs } from '../../config/useConfigs'
import { addPoolsWithChain } from '../reducer'
import { useDispatch, useSelector } from 'react-redux'
import { State } from '../../types'
import { addTokensReduce } from '../../token/reducer'
import { useSwapHistory } from '../../wallet/hooks/useSwapHistory'

export const useListPool = () => {
  const { poolGroups } = useSelector((state: State) => {
    return {
      poolGroups: state.resources.poolGroups
    }
  })
  const { chainId, ddlEngine } = useConfigs()
  const dispatch = useDispatch()
  const { updateSwapTxsHandle } = useSwapHistory()

  const initListPool = async (account: string) => {
    if (ddlEngine) {
      ddlEngine.RESOURCE.getResourceCached(account).then((data: any) => {
        console.log('data', data)
        dispatch(addTokensReduce({ tokens: data.tokens, chainId }))
        dispatch(addPoolsWithChain({ poolGroups: data.poolGroups, chainId }))
        updateSwapTxsHandle(account, data.swapLogs)
      })
      ddlEngine.RESOURCE.getNewResource(account).then((data: any) => {
        console.log('new data', data)
        dispatch(addTokensReduce({ tokens: data.tokens, chainId }))
        dispatch(addPoolsWithChain({ poolGroups: data.poolGroups, chainId }))
        updateSwapTxsHandle(account, data.swapLogs)
      })
    }
  }

  return { initListPool, updateSwapTxsHandle, poolGroups: poolGroups[chainId] }
}
