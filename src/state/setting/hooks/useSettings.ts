import { useDispatch, useSelector } from 'react-redux'
import {
  setDeleverageChanceReduce,
  setMinInterestRateReduce,
  setMinLiquidityReduce,
  setPayoffMinRateReduce, setScanApiKeyReduce,
  setSlippageReduce
} from '../reducer'
import { State } from '../../types'
import { useConfigs } from '../../config/useConfigs'

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
  return {
    settings,
    setSlippage,
    setScanApi,
    setDeleverageChance,
    setMinInterestRate,
    setPayoffMinRate,
    setMinLiquidity
  }
}
