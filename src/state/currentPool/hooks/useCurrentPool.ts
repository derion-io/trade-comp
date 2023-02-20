import { useDispatch, useSelector } from 'react-redux'
import { State } from '../../types'
import { useListPool } from '../../pools/hooks/useListPool'
import { useConfigs } from '../../config/useConfigs'
import { setCandleChartIsLoadingReduce, setChartTimeFocusReduce, setCurrentPoolInfo } from '../reducer'

export const useCurrentPool = () => {
  const { pools } = useListPool()
  const { configs, ddlEngine } = useConfigs()
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
    candleChartIsLoading,
    chartTimeFocus,
    chartResolutionIsUpdated
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
      candleChartIsLoading: state.currentPool.candleChartIsLoading,
      chartTimeFocus: state.currentPool.chartTimeFocus,
      chartResolutionIsUpdated: state.currentPool.chartResolutionIsUpdated
    }
  })

  const updateCurrentPool = async (poolAddress: string) => {
    const pool = pools[poolAddress]
    const { cPrice } = pool

    if (ddlEngine) {
      ddlEngine.setCurrentPool({
        ...pools[poolAddress],
        logic: pools[poolAddress].logic,
        cTokenPrice: pools[poolAddress].cTokenPrice
      })
    }

    dispatch(setCurrentPoolInfo({
      ...pool,
      cTokenPrice: cPrice,
      logicAddress: pool.logic
    }))
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

  const setChartTimeFocus = (time: number) => {
    dispatch(setChartTimeFocusReduce({ time }))
  }

  return {
    setChartTimeFocus,
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
    chartIsOutDate,
    chartTimeFocus,
    chartResolutionIsUpdated
  }
}
