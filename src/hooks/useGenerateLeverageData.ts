import { useMemo } from 'react'
import { POOL_IDS } from '../utils/constant'
import { useCurrentPool } from '../state/currentPool/hooks/useCurrentPool'
import { useTokenValue } from '../Components/SwapBox/hooks/useTokenValue'
import { add, bn, numberToWei, weiToNumber } from '../utils/helpers'
import { useListTokens } from '../state/token/hook'

const barColors = ['#01A7FA', '#FF98E5', '#4FBF67', '#3DBAA2']

export const useGenerateLeverageData = (isLong: boolean) => {
  const { pools } = useCurrentPool()
  const { tokens } = useListTokens()
  const { getTokenValue } = useTokenValue({})

  return useMemo(() => {
    const result = {}
    if (Object.values(pools).length > 0) {
      Object.values(pools).forEach((pool) => {
        const size = bn(numberToWei(getTokenValue(
          pool.TOKEN_R,
          weiToNumber(pool.states.R, tokens[pool.TOKEN_R]?.decimals)
        )))

        if (!result[pool.k.toNumber()]) {
          result[pool.k.toNumber()] = {
            x: pool.k.toNumber(),
            xDisplay: (pool.k.toNumber() / 2) + 'x',
            totalSize: size,
            bars: [
              {
                x: pool.k.toNumber(),
                token: pool.poolAddress + '-' + (isLong ? POOL_IDS.A : POOL_IDS.B),
                size,
                color: barColors[0]
              }
            ]
          }
        } else {
          const bars = result[pool.k.toNumber()]
          bars.push({
            x: pool.k.toNumber(),
            token: pool.poolAddress + '-' + (isLong ? POOL_IDS.A : POOL_IDS.B),
            size,
            color: barColors[bars.length]
          })
          result[pool.k.toNumber()].bars = bars
          result[pool.k.toNumber()].totalSize = result[pool.k.toNumber()].totalSize.add(size)
        }
      })
    }

    let maxTotalSize = bn(0)
    for (const i in result) {
      if (result[i].totalSize.gt(maxTotalSize)) {
        maxTotalSize = result[i].totalSize
      }
    }

    let data = Object.values(result)
    data = data.map((leverage: any) => {
      const bars = leverage.bars.map((bar: any) => {
        return {
          ...bar,
          reserve: bar.size,
          size: bar.size.mul(10000).div(maxTotalSize).toNumber() / 100
          // size: 50 + leverage.x
        }
      })

      return {
        ...leverage,
        bars
      }
    })

    console.log('khanh', result, maxTotalSize.toString(), data)

    return data
  }, [pools, isLong])
}
