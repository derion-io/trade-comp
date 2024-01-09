import { useConfigs } from '../../config/useConfigs'
import { addPoolGroupsWithChain, addPoolsWithChain } from '../reducer'
import { useDispatch, useSelector } from 'react-redux'
import { State } from '../../types'
import { addTokensReduce } from '../../token/reducer'
import { useSwapHistory } from '../../wallet/hooks/useSwapHistory'
import { useMemo } from 'react'
import { useWalletBalance } from '../../wallet/hooks/useBalances'
import { useTokenValue } from '../../../Components/SwapBox/hooks/useTokenValue'
import { IEW, NUM } from '../../../utils/helpers'
import { useListTokens } from '../../token/hook'
import { POOL_IDS } from '../../../utils/constant'
import { PoolGroupType, PoolGroupValueType } from '../type'

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
  const useCalculatePoolGroupsValue = () => {
    const { balances } = useWalletBalance()
    const { getTokenValue } = useTokenValue({})
    const { tokens } = useListTokens()
    const { chainId } = useConfigs()
    return useMemo(() => {
      const poolGroupsValue: PoolGroupValueType = {}
      Object.keys(poolGroups[chainId]).map((indexKey:string) => {
        const poolGroup = poolGroups[chainId][indexKey]
        let poolGroupValue = 0
        let poolGroupPositionValue = 0
        if (!poolGroup?.pools) return
        const results = []
        if (Object.keys(balances).length === 0) {
          for (const poolAddress of Object.keys(poolGroup.pools)) {
            const pool = poolGroup.pools[poolAddress]
            poolGroupValue += NUM(getTokenValue(
                  pool?.TOKEN_R,
                  IEW(pool?.states?.R, tokens[pool?.TOKEN_R]?.decimals),
                  true
            ))
          }
        } else {
          for (const poolAddress of Object.keys(poolGroup.pools)) {
            const pool = poolGroup.pools[poolAddress]
            if (balances[poolAddress + '-' + POOL_IDS.A]) {
              results.push(poolAddress + '-' + POOL_IDS.A)
            }
            if (balances[poolAddress + '-' + POOL_IDS.B]) {
              results.push(poolAddress + '-' + POOL_IDS.B)
            }
            if (balances[poolAddress + '-' + POOL_IDS.C]) {
              results.unshift(poolAddress + '-' + POOL_IDS.C)
              poolGroupValue += NUM(getTokenValue(
                pool?.TOKEN_R,
                IEW(pool?.states?.R, tokens[pool?.TOKEN_R]?.decimals),
                true
              ))
            }
          }
        }
        const poolGroupPositions = results.map((address) => {
          const value = Number(
            getTokenValue(
              address,
              IEW(balances[address], tokens[address]?.decimal || 18),
              true
            )
          )
          poolGroupPositionValue += value
          return { address, value }
        }).filter(token => token.address !== null && token.value > 0)
        poolGroupsValue[indexKey] = {
          poolGroupValue,
          poolGroupPositionValue,
          poolGroupPositions
        }
      })
      return { poolGroupsValue }
    }, [poolGroups, tokens, balances])
  }
  return {
    initResource: initListPool,
    updateSwapTxsHandle,
    useCalculatePoolGroupsValue,
    addNewResource,
    poolGroups: poolGroups[chainId],
    pools: pools[chainId]
  }
}
