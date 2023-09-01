import { useDispatch, useSelector } from 'react-redux'
import { State } from '../../types'
import { useConfigs } from '../../config/useConfigs'
import {
  setCandleChartIsLoadingReduce,
  setChartTabReduce,
  setChartTimeFocusReduce,
  setCurrentPoolInfo,
  setSwapTabReduce
} from '../reducer'
import { useResource } from '../../resources/hooks/useResource'
import { CHART_TABS } from '../type'
import { TRADE_TYPE } from '../../../utils/constant'

export const useCurrentPoolGroup = () => {
  const { poolGroups } = useResource()
  const { ddlEngine } = useConfigs()
  const dispatch = useDispatch()

  const currentPool = useSelector((state: State) => {
    return {
      ...state.currentPool
    }
  })

  const setChartTab = (tab: CHART_TABS) => {
    dispatch(setChartTabReduce({ tab }))
  }

  const setTradeType = (tab: TRADE_TYPE) => {
    dispatch(setSwapTabReduce({ tab }))
  }

  const updateCurrentPoolGroup = async (uniPoolAddress: string) => {
    const poolGroup = poolGroups[uniPoolAddress]
    // const { cPrice } = pool

    if (ddlEngine) {
      ddlEngine.setCurrentPool({
        ...poolGroups[uniPoolAddress]
        // logic: pools[poolAddress].logic,
        // cTokenPrice: pools[poolAddress].cTokenPrice
      })
    }

    dispatch(
      setCurrentPoolInfo({
        ...poolGroup,
        id: uniPoolAddress
        // cTokenPrice: cPrice,
        // logicAddress: pool.logic
      })
    )
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
    updateCurrentPoolGroup,
    setCandleChartIsLoading,
    setChartTab,
    setTradeType,
    ...currentPool
  }
}
