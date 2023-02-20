import { useConfigs } from '../../config/useConfigs'
import { addPoolsWithChain } from '../reducer'
import { useDispatch, useSelector } from 'react-redux'
import { State } from '../../types'
import { addTokensReduce } from '../../token/reducer'
import { updateSwapTxs } from '../../wallet/reducer'
import _ from 'lodash'

export const useListPool = () => {
  const { pools } = useSelector((state: State) => {
    return {
      pools: state.pools.pools
    }
  })
  const { chainId, ddlEngine } = useConfigs()
  const dispatch = useDispatch()

  const initListPool = async (account: string) => {
    if (ddlEngine) {
      ddlEngine.RESOURCE.getResourceCached(account).then((data: any) => {
        dispatch(addTokensReduce({ tokens: data.tokens, chainId }))
        dispatch(addPoolsWithChain({ pools: data.pools, chainId }))
        dispatch(updateSwapTxs({ account, swapLogs: _.cloneDeep(data.swapLogs) }))
      })
      ddlEngine.RESOURCE.getNewResource(account).then((data: any) => {
        dispatch(addTokensReduce({ tokens: data.tokens, chainId }))
        dispatch(addPoolsWithChain({ pools: data.pools, chainId }))
        dispatch(updateSwapTxs({ account, swapLogs: _.cloneDeep(data.swapLogs) }))
      })
    }
  }

  return { initListPool, pools: pools[chainId] }
}
