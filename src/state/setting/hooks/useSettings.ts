import { useDispatch, useSelector } from 'react-redux'
import {
  setDeleverageChanceReduce,
  setMaxInterestRateReduce,
  setMinLiquidityReduce,
  setMinPayoffRateReduce,
  setScanApiKeyReduce,
  setSlippageReduce,
  setSortPoolBuyReduce,
  setShowBalanceReduce,
} from '../reducer'
import { State } from '../../types'
import { useConfigs } from '../../config/useConfigs'
import { SORT_POOL_BY } from '../type'

export const useSettings = () => {
  const { chainId } = useConfigs()
  const settings = useSelector((state: State) => {
    return {
      ...state.settings
    }
  })

  const dispatch = useDispatch()
  const setSlippage = (slippage: number) => {
    dispatch(setSlippageReduce({ slippage }))
  }
  const setMaxDeleverageRisk = (maxDeleverageRisk: number) => {
    dispatch(setDeleverageChanceReduce({ maxDeleverageRisk }))
  }
  const setMaxInterestRate = (maxInterestRate: number) => {
    dispatch(setMaxInterestRateReduce({ maxInterestRate }))
  }
  const setMinPayoffRate = (minPayoffRate: number) => {
    dispatch(setMinPayoffRateReduce({ minPayoffRate }))
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
    dispatch(setShowBalanceReduce({ showBalance }))
  }
  return {
    settings,
    setSortPoolBuy,
    setSlippage,
    setScanApi,
    setMaxDeleverageRisk,
    setMaxInterestRate,
    setMinPayoffRate,
    setMinLiquidityShare,
    setShowBalance
  }
}
