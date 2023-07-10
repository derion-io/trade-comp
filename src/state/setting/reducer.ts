// eslint-disable-next-line no-unused-vars
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { initialState } from './type'
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
      state.slippage = action.payload.slippage
    },
    setPayoffMinRateReduce: (
      state,
      action: PayloadAction<{
        payoffMinRate: any
      }>
    ) => {
      state.payoffMinRate = action.payload.payoffMinRate
    },
    setMinInterestRateReduce: (
      state,
      action: PayloadAction<{
        minInterestRate: any
      }>
    ) => {
      state.minInterestRate = action.payload.minInterestRate
    },
    setMinLiquidityReduce: (
      state,
      action: PayloadAction<{
        minLiquidity: any
      }>
    ) => {
      state.minLiquidity = action.payload.minLiquidity
    },
    setDeleverageChanceReduce: (
      state,
      action: PayloadAction<{
        deleverageChance: any
      }>
    ) => {
      state.deleverageChance = action.payload.deleverageChance
    }
  }
})

// Actions
export const {
  setSlippageReduce,
  setDeleverageChanceReduce,
  setMinInterestRateReduce,
  setPayoffMinRateReduce,
  setMinLiquidityReduce
} = tokens.actions

export default tokens.reducer
