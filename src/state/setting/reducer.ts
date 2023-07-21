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
        minPayoffRate: any
      }>
    ) => {
      localStorage.setItem('minPayoffRate', action.payload.minPayoffRate)
      state.minPayoffRate = action.payload.minPayoffRate
    },
    setMinInterestRateReduce: (
      state,
      action: PayloadAction<{
        maxInterestRate: any
      }>
    ) => {
      localStorage.setItem('maxInterestRate', action.payload.maxInterestRate)
      state.maxInterestRate = action.payload.maxInterestRate
    },
    setMinLiquidityReduce: (
      state,
      action: PayloadAction<{
        minLiquidityShare: any
      }>
    ) => {
      localStorage.setItem('minLiquidityShare', action.payload.minLiquidityShare)
      state.minLiquidityShare = action.payload.minLiquidityShare
    },
    setDeleverageChanceReduce: (
      state,
      action: PayloadAction<{
        maxDeleverageRisk: any
      }>
    ) => {
      localStorage.setItem('maxDeleverageRisk', action.payload.maxDeleverageRisk)
      state.maxDeleverageRisk = action.payload.maxDeleverageRisk
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
