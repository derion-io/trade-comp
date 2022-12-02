import { useSelector } from 'react-redux'
import { State } from '../../types'
import { div, formatPercent, sub } from '../../../utils/helpers'
import { useListPool } from '../../pools/hooks/useListPool'

export const useCurrentPool = () => {
  const { pools } = useListPool()

  const {
    cTokenPrice,
    cToken,
    logicAddress,
    dTokens,
    powers,
    states,
    baseId,
    quoteId,
    baseToken,
    quoteToken,
    basePrice,
    changedIn24h,
    poolAddress,
    chartIsOutDate
  } = useSelector((state: State) => {
    return {
      cTokenPrice: state.currentPool.cTokenPrice,
      cToken: state.currentPool.cToken,
      logicAddress: state.currentPool.logicAddress,
      dTokens: state.currentPool.dTokens,
      powers: state.currentPool.powers,
      states: state.currentPool.states,
      baseToken: state.currentPool.baseToken,
      quoteToken: state.currentPool.quoteToken,
      basePrice: state.currentPool.basePrice,
      baseId: state.currentPool.baseId,
      quoteId: state.currentPool.quoteId,
      changedIn24h: state.currentPool.changedIn24h,
      poolAddress: state.currentPool.poolAddress,
      chartIsOutDate: state.currentPool.chartIsOutDate
    }
  })

  const updateCurrentPool = async (poolAddress: string) => {
    const pool = pools[poolAddress]
    const { cPrice } = pool

    return {
      ...pool,
      cTokenPrice: cPrice,
      logicAddress: pool.logic
    }
  }

  const getTokenByPower = (power: number | string) => {
    if (power === 'C') {
      return cToken
    }
    const index = powers.findIndex((p) => p === Number(power))
    return dTokens[index]
  }

  return {
    getTokenByPower,
    updateCurrentPool,
    basePrice,
    changedIn24h,
    cTokenPrice,
    baseToken,
    quoteToken,
    powers,
    cToken,
    baseId,
    quoteId,
    logicAddress,
    dTokens,
    states,
    poolAddress
  }
}
