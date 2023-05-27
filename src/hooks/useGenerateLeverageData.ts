import { useMemo } from 'react'
import { POOL_IDS } from '../utils/constant'
import { useCurrentPool } from '../state/currentPool/hooks/useCurrentPool'

const barColors = ['#01A7FA', '#FF98E5', '#4FBF67', '#3DBAA2']

export const useGenerateLeverageData = (isLong: boolean) => {
  const { pools } = useCurrentPool()
  return useMemo(() => {
    const result = {}
    if (Object.values(pools).length > 0) {
      Object.values(pools).forEach((pool) => {
        if (!result[pool.k.toNumber()]) {
          result[pool.k.toNumber()] = {
            x: pool.k.toNumber(),
            xDisplay: (pool.k.toNumber() / 2) + 'x',
            bars: [
              {
                token: pool.poolAddress + '-' + (isLong ? POOL_IDS.A : POOL_IDS.B),
                size: 100,
                color: barColors[0]
              }
            ]
          }
        } else {
          let bars = result[pool.k.toNumber()]
          bars.push({
            token: pool.poolAddress + '-' + (isLong ? POOL_IDS.A : POOL_IDS.B),
            size: 100,
            color: barColors[bars.length]
          })
          bars = bars.map((bar: any) => {
            return {
              ...bar,
              size: 100 / bars.length
            }
          })
          result[pool.k.toNumber()].bars = bars
        }
      })
    }
    return Object.values(result)
  }, [pools, isLong])
}
