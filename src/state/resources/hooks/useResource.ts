import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTokenValue } from '../../../Components/SwapBox/hooks/useTokenValue'
import { POOL_IDS } from '../../../utils/constant'
import { IEW, NUM, STR } from '../../../utils/helpers'
import { useConfigs } from '../../config/useConfigs'
import { useListTokens } from '../../token/hook'
import { addTokensReduce } from '../../token/reducer'
import { State } from '../../types'
import { useWalletBalance } from '../../wallet/hooks/useBalances'
import { useSwapHistory } from '../../wallet/hooks/useSwapHistory'
import { addPoolGroupsWithChain, addPoolsWithChain } from '../reducer'
import { PoolGroupValueType, PoolType } from '../type'

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
      const pool = searchParams.get('pool')
      ddlEngine.RESOURCE.getWhiteListResource(pool ? [pool] : []).then(
        (data) => {
          console.log('#getWhiteListResource', data)
          if (data?.tokens?.length === 0) return
          addNewResource(data, account)
          // updateSwapTxsHandle(account, data.swapLogs, data.transferLogs)
        }
      )

      ddlEngine.RESOURCE.getResourceCached(account, playMode).then((data) => {
        console.log('#getResourceCached', data)
        if (data?.tokens?.length === 0) return
        addNewResource(data, account)
        updateSwapTxsHandle(account, data.swapLogs, data.transferLogs)
      })
      ddlEngine.RESOURCE.getNewResource(account, playMode).then((data) => {
        console.log('#getNewResource', data)
        if (data?.tokens?.length === 0) return
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
        let poolGroupValueR = 0
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
            poolGroupValueR += NUM(IEW(pool?.states?.R, tokens[pool?.TOKEN_R]?.decimals))
          }
        } else {
          for (const poolAddress of Object.keys(poolGroup.pools)) {
            const pool = poolGroup.pools[poolAddress]
            poolGroupValueR += NUM(IEW(pool?.states?.R, tokens[pool?.TOKEN_R]?.decimals))
            poolGroupValue += NUM(getTokenValue(
              pool?.TOKEN_R,
              STR(poolGroupValueR),
              true
            ))
            if (balances[poolAddress + '-' + POOL_IDS.A]) {
              results.push(poolAddress + '-' + POOL_IDS.A)
            }
            if (balances[poolAddress + '-' + POOL_IDS.B]) {
              results.push(poolAddress + '-' + POOL_IDS.B)
            }
            if (balances[poolAddress + '-' + POOL_IDS.C]) {
              results.unshift(poolAddress + '-' + POOL_IDS.C)
            }
          }
        }
        const poolGroupPositions = results.map((address) => {
          const value = Number(
            getTokenValue(
              address,
              IEW(balances[address], tokens[address]?.decimals || 18),
              true
            )
          )
          poolGroupPositionValue += value
          return { address, value }
        }).filter(token => token.address !== null && token.value > 0)
        poolGroupsValue[indexKey] = {
          poolGroupValue,
          poolGroupValueR,
          poolGroupPositionValue,
          poolGroupPositions
        }
      })
      const poolGroupsValueEntries = Object.entries(poolGroupsValue)

      poolGroupsValueEntries.sort(
        ([, a], [, b]) =>
          ((b as any).poolGroupPositionValue ?? 0) - ((a as any).poolGroupPositionValue ?? 0) ||
          ((b as any).poolGroupValueR ?? 0) - ((a as any).poolGroupValueR ?? 0)
      )

      const poolGroupsSortValue = {}
      for (const [key, value] of poolGroupsValueEntries) {
        poolGroupsSortValue[key] = value
      }
      return { poolGroupsValue: poolGroupsSortValue }
    }, [poolGroups, tokens, balances])
  }
  const useCalculatePoolValue = () => {
    const { balances } = useWalletBalance()
    const { getTokenValue } = useTokenValue({})
    const { tokens } = useListTokens()
    return useCallback((pool: PoolType) => {
      const { poolAddress } = pool
      const results:string[] = []
      let poolPositionsValue = 0
      const poolValue = NUM(getTokenValue(
        pool?.TOKEN_R,
        IEW(pool?.states?.R, tokens[pool?.TOKEN_R]?.decimals),
        true
      ))
      const poolValueR = NUM(IEW(pool?.states?.R, tokens[pool?.TOKEN_R]?.decimals))
      if (balances[poolAddress + '-' + POOL_IDS.A]) {
        results.push(poolAddress + '-' + POOL_IDS.A)
      }
      if (balances[poolAddress + '-' + POOL_IDS.B]) {
        results.push(poolAddress + '-' + POOL_IDS.B)
      }
      if (balances[poolAddress + '-' + POOL_IDS.C]) {
        results.unshift(poolAddress + '-' + POOL_IDS.C)
      }
      const poolPositions = results.map((address) => {
        const value = Number(
          getTokenValue(
            address,
            IEW(balances[address], tokens[address]?.decimals || 18),
            true
          )
        )
        poolPositionsValue += value
        return { address, value }
      }).filter(token => token.address !== null && token.value > 0)

      return {
        poolValue,
        poolValueR,
        poolPositions,
        poolPositionsValue
      }
    }, [poolGroups, tokens, balances])
  }
  return {
    initResource: initListPool,
    updateSwapTxsHandle,
    useCalculatePoolGroupsValue,
    useCalculatePoolValue,
    addNewResource,
    poolGroups: poolGroups[chainId],
    pools: pools[chainId]
  }
}
