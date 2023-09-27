import { useDispatch, useSelector } from 'react-redux'
import {
  setDeleverageChanceReduce,
  setMaxInterestRateReduce,
  setMinLiquidityReduce,
  setScanApiKeyReduce,
  setSlippageReduce,
  setSortPoolBuyReduce,
  setShowBalanceReduce,
  setShowValueInUsdReduce
} from '../reducer'
import { State } from '../../types'
import { useConfigs } from '../../config/useConfigs'
import { SORT_POOL_BY, VALUE_IN_USD_STATUS } from '../type'

export const useSettings = () => {
  const { chainId } = useConfigs()
  const settings = useSelector((state: State) => {
    return {
      ...state.settings
    }
  })

  const dispatch = useDispatch()
  const setSlippage = (slippage: number) => {
    dispatch(setSlippageReduce({ slippageTolerance: slippage }))
  }
  const setMaxDeleverageRisk = (maxDeleverageRisk: number) => {
    dispatch(setDeleverageChanceReduce({ maxDeleverageRisk }))
  }
  const setMaxInterestRate = (maxInterestRate: number) => {
    dispatch(setMaxInterestRateReduce({ maxInterestRate }))
  }
  const setMinLiquidityShare = (minLiquidityShare: number) => {
    dispatch(setMinLiquidityReduce({ minLiquidityShare }))
  }
  const setScanApi = (scanApiKey: string) => {
    dispatch(setScanApiKeyReduce({ chainId, scanApiKey }))
  }
  const setSortPoolBuy = (sortPoolBy: SORT_POOL_BY) => {
    dispatch(setSortPoolBuyReduce({ chainId, sortPoolBy }))
  }
  const setShowBalance = (showBalance: boolean) => {
    localStorage.setItem('isShowBalance', String(showBalance))
    dispatch(setShowBalanceReduce({ showBalance }))
  }
  const setShowValueInUsd = (status: VALUE_IN_USD_STATUS) => {
    dispatch(setShowValueInUsdReduce({ status }))
  }

  return {
    settings,
    setSortPoolBuy,
    setSlippage,
    setScanApi,
    setMaxDeleverageRisk,
    setMaxInterestRate,
    setMinLiquidityShare,
    setShowBalance,
    setShowValueInUsd
  }
}
