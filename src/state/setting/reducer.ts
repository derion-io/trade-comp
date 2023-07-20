// eslint-disable-next-line no-unused-vars
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { initialState, SORT_POOL_BY } from './type'
export const tokens = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setSlippageReduce: (
      state,
      action: PayloadAction<{
        slippage: any
      }>
    ) => {
      localStorage.setItem('slippage', action.payload.slippage)
      state.slippage = action.payload.slippage
    },
    setPayoffMinRateReduce: (
      state,
      action: PayloadAction<{
        payoffMinRate: any
      }>
    ) => {
      localStorage.setItem('payoffMinRate', action.payload.payoffMinRate)
      state.payoffMinRate = action.payload.payoffMinRate
    },
    setMinInterestRateReduce: (
      state,
      action: PayloadAction<{
        minInterestRate: any
      }>
    ) => {
      localStorage.setItem('minInterestRate', action.payload.minInterestRate)
      state.minInterestRate = action.payload.minInterestRate
    },
    setMinLiquidityReduce: (
      state,
      action: PayloadAction<{
        minLiquidity: any
      }>
    ) => {
      localStorage.setItem('minLiquidity', action.payload.minLiquidity)
      state.minLiquidity = action.payload.minLiquidity
    },
    setDeleverageChanceReduce: (
      state,
      action: PayloadAction<{
        deleverageChance: any
      }>
    ) => {
      localStorage.setItem('deleverageChance', action.payload.deleverageChance)
      state.deleverageChance = action.payload.deleverageChance
    },
    setScanApiKeyReduce: (
      state,
      action: PayloadAction<{
        scanApiKey: string
        chainId: number
      }>
    ) => {
      localStorage.setItem(`scanApiKey-${action.payload.chainId}`, action.payload.scanApiKey)
      state.scanApiKey[action.payload.chainId] = action.payload.scanApiKey
    },
    setSortPoolBuyReduce: (
      state,
      action: PayloadAction<{
        sortPoolBy: SORT_POOL_BY
        chainId: number
      }>
    ) => {
      localStorage.setItem('sortPoolBy', action.payload.sortPoolBy.toString())
      state.sortPoolBy = action.payload.sortPoolBy
    }
  }
})

// Actions
export const {
  setScanApiKeyReduce,
  setSlippageReduce,
  setDeleverageChanceReduce,
  setMinInterestRateReduce,
  setPayoffMinRateReduce,
  setMinLiquidityReduce,
  setSortPoolBuyReduce
} = tokens.actions

export default tokens.reducer
