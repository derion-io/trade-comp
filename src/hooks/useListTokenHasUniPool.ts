import { PoolType } from '../state/resources/type'
import { useMemo } from 'react'
import { useConfigs } from '../state/config/useConfigs'

export const useListTokenHasUniPool = (pool: PoolType) => {
  const { routes } = useConfigs()

  const erc20TokenSupported = useMemo(() => {
    if (!pool?.TOKEN_R) return []
    return Object.keys(routes).map((pair) => {
      const pairTokens = pair.split('-')
      if (pairTokens.includes(pool.TOKEN_R)) {
        return pairTokens[0] === pool.TOKEN_R ? pairTokens[1] : pairTokens[0]
      }
      return false
    }).filter((t) => t)
  }, [routes, pool])

  return { erc20TokenSupported }
}
