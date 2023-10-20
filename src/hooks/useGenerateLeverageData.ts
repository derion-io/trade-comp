import { useMemo } from 'react'
import { TRADE_TYPE } from '../utils/constant'
import { useCurrentPoolGroup } from '../state/currentPool/hooks/useCurrentPoolGroup'
import { bn, getPoolPower, tradeTypeToId } from '../utils/helpers'
import { useSettings } from '../state/setting/hooks/useSettings'
import { SORT_POOL_BY } from '../state/setting/type'

export const useGenerateLeverageData = (tradeType: TRADE_TYPE) => {
  // useCurrentPoolGroup since we only show leverage bars for pool of the current index
  const { pools } = useCurrentPoolGroup()
  const {
    settings: {
      minLiquidityShare,
      maxDeleverageRisk,
      maxInterestRate,
      sortPoolBy
    }
  } = useSettings()

  const color =
    tradeType === TRADE_TYPE.LONG
      ? '#3dbaa2'
      : tradeType === TRADE_TYPE.SHORT
        ? '#ff7a68'
        : '#01a7fa'

  return useMemo(() => {
    const result = {}
    if (Object.values(pools).length > 0) {
      const sumR = Object.values(pools).reduce((sumR, pool) => {
        return (sumR = sumR.add(pool.states.R))
      }, bn(0))
      const minR = sumR
        .mul(Math.round(minLiquidityShare * 1000))
        .div(100 * 1000)

      Object.values(pools).forEach((pool) => {
        let deleverageRisk =
          tradeType === TRADE_TYPE.LONG
            ? pool!.deleverageRiskA
            : tradeType === TRADE_TYPE.SHORT
              ? pool!.deleverageRiskB
              : Math.max(pool!.deleverageRiskA, pool!.deleverageRiskB)
        deleverageRisk = Math.min(1, deleverageRisk)

        if (
          pool.states.R.lt(minR) ||
          Number(pool.interestRate) * 99 >
            maxInterestRate * pool.k.toNumber() ||
          deleverageRisk * 99 > (maxDeleverageRisk ?? 100)
        ) {
          return
        }

        const opacity = 1 - 0.95 * deleverageRisk
        const power = getPoolPower(pool)
        const size = pool.states.R

        if (!result[power]) {
          result[power] = {
            x: power,
            xDisplay: power + 'x',
            totalSize: size,
            bars: [
              {
                x: power,
                token: pool.poolAddress + '-' + tradeTypeToId(tradeType),
                size,
                color,
                opacity,
                interestRate: pool.interestRate,
                premium: pool.premium,
                maxPremiumRate: pool.maxPremiumRate,
                deleverageRisk
              }
            ]
          }
        } else {
          const bars = result[power].bars
          bars.push({
            x: power,
            token: pool.poolAddress + '-' + tradeTypeToId(tradeType),
            size,
            color,
            opacity,
            interestRate: pool.interestRate,
            premium: pool.premium,
            maxPremiumRate: pool.maxPremiumRate,
            deleverageRisk
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
        bars: bars.sort((a: any, b: any) => {
          if (sortPoolBy === SORT_POOL_BY.INTEREST_RATE) {
            return a.interestRate - b.interestRate
          } else if (sortPoolBy === SORT_POOL_BY.DELEVERAGE_RISK) {
            return a.deleverageRisk - b.deleverageRisk
          }
          return b.size - a.size
        })
      }
    })

    return data
  }, [
    pools,
    tradeType,
    minLiquidityShare,
    maxDeleverageRisk,
    maxInterestRate,
    sortPoolBy
  ])
}
