import { useDispatch, useSelector } from 'react-redux'
import { State } from '../../types'
import { useListPool } from '../../pools/hooks/useListPool'
import { useConfigs } from '../../config/useConfigs'
import { setCandleChartIsLoadingReduce } from '../reducer'

export const useCurrentPool = () => {
  const { pools } = useListPool()
  const { configs } = useConfigs()
  const dispatch = useDispatch()

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
    chartIsOutDate,
    candleChartIsLoading
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
      chartIsOutDate: state.currentPool.chartIsOutDate,
      candleChartIsLoading: state.currentPool.candleChartIsLoading
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
    } else if (power === 'B') {
      return baseToken
    } else if (power === 'Q') {
      return quoteToken
    } else if (power === 'N') { // native token
      return configs.addresses.nativeToken
    }
    const index = powers.findIndex((p) => p === Number(power))
    return dTokens[index]
  }
  const detectChangeType = (address: string) => {
    if (address === baseToken || address === configs.addresses.nativeToken) {
      return 'B'
    } else if (address === quoteToken) {
      return 'Q'
    } else {
      return 'C'
    }
  }

  const setCandleChartIsLoading = (status: boolean) => {
    dispatch(setCandleChartIsLoadingReduce({ status }))
  }

  return {
    detectChangeType,
    getTokenByPower,
    updateCurrentPool,
    setCandleChartIsLoading,
    candleChartIsLoading,
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
    poolAddress,
    chartIsOutDate
  }
}
