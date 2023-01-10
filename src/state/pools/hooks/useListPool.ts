import { useConfigs } from '../../config/useConfigs'
import { addPoolsWithChain } from '../reducer'
import { useDispatch, useSelector } from 'react-redux'
import { State } from '../../types'
import { addTokensReduce } from '../../token/reducer'
import { DdlResource } from 'derivable-tools/dist/pools'
import { updateSwapTxs } from '../../wallet/reducer'
import _ from 'lodash'

export const useListPool = () => {
  const { pools, ddlResource } = useSelector((state: State) => {
    return {
      pools: state.pools.pools,
      ddlResource: state.pools.ddlResource
    }
  })
  const { configs, chainId } = useConfigs()
  const dispatch = useDispatch()

  const initListPool = async (account: string) => {
    const resource = new DdlResource({
      account,
      storage: {
        // @ts-ignore
        setItem: (itemName, value) => localStorage.setItem(itemName, value),
        // @ts-ignore
        getItem: (itemName) => localStorage.getItem(itemName)
      },
      chainId,
      scanApi: configs.scanApi,
      rpcUrl: configs.rpcUrl
    })

    resource.getResourceCached(account).then((data: any) => {
      dispatch(addTokensReduce({ tokens: data.tokens, chainId }))
      dispatch(addPoolsWithChain({ pools: data.pools, chainId }))
      dispatch(updateSwapTxs({ account, swapLogs: data.swapLogs }))
    })
    resource.getNewResource(account).then((data: any) => {
      dispatch(addTokensReduce({ tokens: data.tokens, chainId }))
      dispatch(addPoolsWithChain({ pools: data.pools, chainId }))
      dispatch(updateSwapTxs({ account, swapLogs: _.cloneDeep(data.swapLogs) }))
    })
  }

  return { initListPool, pools: pools[chainId], ddlResource }
}
