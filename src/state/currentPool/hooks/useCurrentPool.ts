import { useDispatch, useSelector } from 'react-redux'
import { State } from '../../types'
import { useConfigs } from '../../config/useConfigs'
import { setCandleChartIsLoadingReduce, setChartTimeFocusReduce, setCurrentPoolInfo } from '../reducer'
import { useListPool } from '../../pools/hooks/useListPool'

export const useCurrentPool = () => {
  const { pools: poolGroups } = useListPool()
  const { ddlEngine } = useConfigs()
  const dispatch = useDispatch()

  const currentPool = useSelector((state: State) => {
    return {
      ...state.currentPool
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
    return currentPool.TOKEN_R
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
    ...currentPool
  }
}
