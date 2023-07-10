import { useDispatch, useSelector } from 'react-redux'
import {
  setDeleverageChanceReduce,
  setMinInterestRateReduce,
  setMinLiquidityReduce,
  setPayoffMinRateReduce,
  setSlippageReduce
} from '../reducer'
import { State } from '../../types'

export const useSettings = () => {
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
  return {
    settings,
    setSlippage,
    setDeleverageChance,
    setMinInterestRate,
    setPayoffMinRate,
    setMinLiquidity
  }
}
