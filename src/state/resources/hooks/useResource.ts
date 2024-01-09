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
  const addNewResource = (data:any, account:string) => {
    dispatch(addTokensReduce({ tokens: data.tokens, chainId }))
    dispatch(
      addPoolGroupsWithChain({ poolGroups: data.poolGroups, chainId })
    )
    dispatch(addPoolsWithChain({ pools: data.pools, chainId }))
  }
  const initListPool = async (account: string) => {
    if (ddlEngine && configs.name) {
      const { searchParams } = new URL(`https://1.com?${location.href.split('?')[1]}`)
      const playMode = searchParams.has('play')
      // TODO: add getResourceCache here
      // ddlEngine.RESOURCE.getResourceCached(account, playMode).then((data: any) => {
      //   dispatch(addTokensReduce({ tokens: data.tokens, chainId }))
      //   dispatch(
      //     addPoolGroupsWithChain({ poolGroups: data.poolGroups, chainId })
      //   )
      //   dispatch(addPoolsWithChain({ pools: data.pools, chainId }))
      //   updateSwapTxsHandle(account, data.swapLogs, data.transferLogs)
      // })
      // TODO: use getNewResource here
      ddlEngine.RESOURCE.getWhiteListResource().then((data: any) => {
        addNewResource(data, account)
        updateSwapTxsHandle(account, data.swapLogs, data.transferLogs)
      })
    }
  }

  return {
    initResource: initListPool,
    updateSwapTxsHandle,
    addNewResource,
    poolGroups: poolGroups[chainId],
    pools: pools[chainId]
  }
}
