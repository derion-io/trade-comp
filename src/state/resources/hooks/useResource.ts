import { useConfigs } from '../../config/useConfigs'
import { addPoolGroupsWithChain, addPoolsWithChain } from '../reducer'
import { useDispatch, useSelector } from 'react-redux'
import { State } from '../../types'
import { addTokensReduce } from '../../token/reducer'
import { useSwapHistory } from '../../wallet/hooks/useSwapHistory'

export const useResource = () => {
  const { poolGroups, pools } = useSelector((state: State) => {
    return {
      poolGroups: state.resources.poolGroups,
      pools: state.resources.pools
    }
  })
  const { chainId, ddlEngine, configs } = useConfigs()
  const dispatch = useDispatch()
  const { updateSwapTxsHandle } = useSwapHistory()

  const initListPool = async (account: string) => {
    if (ddlEngine && configs.name) {
      ddlEngine.RESOURCE.getResourceCached(account).then((data: any) => {
        dispatch(addTokensReduce({ tokens: data.tokens, chainId }))
        dispatch(
          addPoolGroupsWithChain({ poolGroups: data.poolGroups, chainId })
        )
        dispatch(addPoolsWithChain({ pools: data.pools, chainId }))
        updateSwapTxsHandle(account, data.swapLogs)
      })
      ddlEngine.RESOURCE.getNewResource(account).then((data: any) => {
        dispatch(addTokensReduce({ tokens: data.tokens, chainId }))
        dispatch(
          addPoolGroupsWithChain({ poolGroups: data.poolGroups, chainId })
        )
        dispatch(addPoolsWithChain({ pools: data.pools, chainId }))
        updateSwapTxsHandle(account, data.swapLogs)
      })
    }
  }

  return {
    initResource: initListPool,
    updateSwapTxsHandle,
    poolGroups: poolGroups[chainId],
    pools: pools[chainId]
  }
}
