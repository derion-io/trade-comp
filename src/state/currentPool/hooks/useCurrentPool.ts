import { useDispatch, useSelector } from 'react-redux'
import { State } from '../../types'
import { useConfigs } from '../../config/useConfigs'
import { setCandleChartIsLoadingReduce, setChartTimeFocusReduce, setCurrentPoolInfo } from '../reducer'
import { useListPool } from '../../pools/hooks/useListPool'

export const useCurrentPool = () => {
  const { pools: poolGroups } = useListPool()
  const { ddlEngine } = useConfigs()
  const dispatch = useDispatch()

  const {
    id,
    UTR,
    TOKEN,
    ORACLE,
    TOKEN_R,
    pools,
    allTokens,
    pair,
    states,
    powers,
    dTokens,
    changedIn24h,
    chartIsOutDate,
    candleChartIsLoading,
    chartTimeFocus,
    chartResolutionIsUpdated
  } = useSelector((state: State) => {
    return {
      id: state.currentPool.id,
      UTR: state.currentPool.UTR,
      TOKEN: state.currentPool.TOKEN,
      ORACLE: state.currentPool.ORACLE,
      TOKEN_R: state.currentPool.TOKEN_R,
      pools: state.currentPool.pools,
      pair: state.currentPool.pair,
      allTokens: state.currentPool.allTokens,
      states: state.currentPool.states,
      powers: state.currentPool.powers,
      dTokens: state.currentPool.dTokens,
      changedIn24h: state.currentPool.changedIn24h,
      chartIsOutDate: state.currentPool.chartIsOutDate,
      candleChartIsLoading: state.currentPool.candleChartIsLoading,
      chartTimeFocus: state.currentPool.chartTimeFocus,
      chartResolutionIsUpdated: state.currentPool.chartResolutionIsUpdated
    }
  })

  const updateCurrentPool = async (poolAddress: string) => {
    const pool = poolGroups[poolAddress]
    // const { cPrice } = pool

    if (ddlEngine) {
      ddlEngine.setCurrentPool({
        ...poolGroups[poolAddress]
        // logic: pools[poolAddress].logic,
        // cTokenPrice: pools[poolAddress].cTokenPrice
      })
    }

    dispatch(setCurrentPoolInfo({
      ...pool,
      id: poolAddress
      // cTokenPrice: cPrice,
      // logicAddress: pool.logic
    }))
  }

  const getTokenByPower = (power: number | string) => {
    return TOKEN_R
    // if (power === 'C') {
    //   return cToken
    // } else if (power === 'B') {
    //   return baseToken
    // } else if (power === 'Q') {
    //   return quoteToken
    // } else if (power === 'N') { // native token
    //   return configs.addresses.nativeToken
    // }
    // const index = powers.findIndex((p) => p === Number(power))
    // return dTokens[index]
  }
  const detectChangeType = (address: string) => {
    return 'R'
    // if (address === TOKEN_R || address === configs.addresses.nativeToken) {
    //   return 'R'
    // } else if (address === quoteToken) {
    //   return 'Q'
    // } else {
    //   return 'C'
    // }
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
    changedIn24h,
    states,
    chartIsOutDate,
    chartTimeFocus,
    chartResolutionIsUpdated,
    UTR,
    TOKEN,
    pools,
    ORACLE,
    TOKEN_R,
    powers,
    dTokens,
    pair,
    allTokens,
    id
  }
}
