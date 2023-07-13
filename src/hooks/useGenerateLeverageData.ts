import { useMemo } from 'react'
import { TRADE_TYPE } from '../utils/constant'
import { useCurrentPoolGroup } from '../state/currentPool/hooks/useCurrentPoolGroup'
import { useTokenValue } from '../Components/SwapBox/hooks/useTokenValue'
import { bn, formatPercent, getTokenPower, numberToWei, tradeTypeToId, weiToNumber } from '../utils/helpers'
import { useListTokens } from '../state/token/hook'
import { useSettings } from '../state/setting/hooks/useSettings'

const barColors = ['#01A7FA', '#FF98E5', '#4FBF67', '#3DBAA2']

export const useGenerateLeverageData = (tradeType: TRADE_TYPE) => {
  const { pools } = useCurrentPoolGroup()
  const { tokens } = useListTokens()
  const { getTokenValue } = useTokenValue({})
  const { settings: { minLiquidity, deleverageChance, minInterestRate } } = useSettings()

  return useMemo(() => {
    const result = {}
    if (Object.values(pools).length > 0) {
      Object.values(pools).forEach((pool) => {
        const size = bn(numberToWei(getTokenValue(
          pool.TOKEN_R,
          weiToNumber(pool.states.R, tokens[pool.TOKEN_R]?.decimals)
        )))
        if (size.lt(numberToWei(minLiquidity, tokens[pool.TOKEN_R]?.decimals)) ||
          Number(pool.dailyInterestRate) * 100 < minInterestRate ||
          (tradeType === TRADE_TYPE.LONG && pool!.deleverageRiskA * 100 > deleverageChance) ||
          (tradeType === TRADE_TYPE.SHORT && pool!.deleverageRiskB * 100 > deleverageChance)
        ) {
          return
        }

        const power = Math.abs(Number(getTokenPower(pool.TOKEN_R, pool.baseToken, tradeTypeToId(tradeType), pool.k.toNumber())))

        if (!result[power]) {
          result[power] = {
            x: power,
            xDisplay: (power) + 'x',
            totalSize: size,
            bars: [
              {
                x: power,
                token: pool.poolAddress + '-' + tradeTypeToId(tradeType),
                size,
                color: barColors[0]
              }
            ]
          }
        } else {
          const bars = result[power].bars
          bars.push({
            x: power,
            token: pool.poolAddress + '-' + tradeTypeToId(tradeType),
            size,
            color: barColors[bars.length]
          })
          result[power].bars = bars
          result[power].totalSize = result[power].totalSize.add(size)
        }
      })
    }

    let maxTotalSize = bn(0)
    for (const i in result) {
      if (result[i].totalSize.gt(maxTotalSize)) {
        maxTotalSize = result[i].totalSize
      }
    }

    let data = maxTotalSize.gt(0) ? Object.values(result) : []
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
        bars: bars.sort((a: any, b: any) => b.size - a.size)
      }
    })

    return data
  }, [pools, tradeType, minLiquidity, deleverageChance, minInterestRate])
}
