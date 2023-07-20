import { useDispatch, useSelector } from 'react-redux'
import {
  setDeleverageChanceReduce,
  setMinInterestRateReduce,
  setMinLiquidityReduce,
  setPayoffMinRateReduce, setScanApiKeyReduce,
  setSlippageReduce, setSortPoolBuyReduce
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
  const setDeleverageChance = (deleverageChance: number) => {
    dispatch(setDeleverageChanceReduce({ deleverageChance }))
  }
  const setMinInterestRate = (minInterestRate: number) => {
    dispatch(setMinInterestRateReduce({ minInterestRate }))
  }
  const setPayoffMinRate = (payoffMinRate: number) => {
    dispatch(setPayoffMinRateReduce({ payoffMinRate }))
  }
  const setMinLiquidity = (minLiquidity: number) => {
    dispatch(setMinLiquidityReduce({ minLiquidity }))
  }
  const setScanApi = (scanApiKey: string) => {
    dispatch(setScanApiKeyReduce({ chainId, scanApiKey }))
  }
  const setSortPoolBuy = (sortPoolBy: SORT_POOL_BY) => {
    dispatch(setSortPoolBuyReduce({ chainId, sortPoolBy }))
  }
  return {
    settings,
    setSortPoolBuy,
    setSlippage,
    setScanApi,
    setDeleverageChance,
    setMinInterestRate,
    setPayoffMinRate,
    setMinLiquidity
  }
}
