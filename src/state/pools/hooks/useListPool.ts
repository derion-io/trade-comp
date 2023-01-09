import { useConfigs } from '../../config/useConfigs'
import { addPoolsWithChain } from '../reducer'
import { useDispatch, useSelector } from 'react-redux'
import { State } from '../../types'
import { addTokensReduce } from '../../token/reducer'
import { useSwapHistory } from '../../wallet/hooks/useSwapHistory'
import { DdlResource } from 'derivable-tools/dist/pools'

export const useListPool = () => {
  const { pools } = useSelector((state: State) => {
    return { pools: state.pools.pools }
  })
  const { configs, chainId } = useConfigs()
  const dispatch = useDispatch()
  const { addMultiSwapData } = useSwapHistory()

  const initListPool = async (account: string) => {
    const resouce = new DdlResource({
      account,
      storage: {
        setItem: (itemName, value) => localStorage.setItem(itemName, value),
        // @ts-ignore
        getItem: (itemName) => localStorage.getItem(itemName)
      },
      chainId,
      scanApi: configs.scanApi,
      rpcUrl: configs.rpcUrl
    })

    await resouce.fetchResourceData()
    addMultiSwapData(resouce.swapLogs, account)
    dispatch(addTokensReduce({ tokens: resouce.tokens, chainId }))
    dispatch(addPoolsWithChain({ pools: resouce.pools, chainId }))
  }

  return { initListPool, pools: pools[chainId] }
}
