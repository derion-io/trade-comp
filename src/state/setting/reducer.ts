// eslint-disable-next-line no-unused-vars
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { initialState, SORT_POOL_BY, VALUE_IN_USD_STATUS } from './type'
export const tokens = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setSlippageReduce: (
      state,
      action: PayloadAction<{
        slippageTolerance: any
      }>
    ) => {
      localStorage.setItem('slippage', action.payload.slippageTolerance)
      state.slippageTolerance = action.payload.slippageTolerance
    },
    setMaxInterestRateReduce: (
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
      localStorage.setItem(
        'minLiquidityShare',
        action.payload.minLiquidityShare
      )
      state.minLiquidityShare = action.payload.minLiquidityShare
    },
    setDeleverageChanceReduce: (
      state,
      action: PayloadAction<{
        maxDeleverageRisk: any
      }>
    ) => {
      localStorage.setItem(
        'maxDeleverageRisk',
        action.payload.maxDeleverageRisk
      )
      state.maxDeleverageRisk = action.payload.maxDeleverageRisk
    },
    setScanApiKeyReduce: (
      state,
      action: PayloadAction<{
        scanApiKey: string
        chainId: number
      }>
    ) => {
      state.scanApiKey[action.payload.chainId] = action.payload.scanApiKey
      localStorage.setItem('scanApiKey', JSON.stringify(state.scanApiKey))
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
    },
    setShowBalanceReduce: (
      state,
      action: PayloadAction<{
        showBalance: boolean
      }>
    ) => {
      localStorage.setItem('showBalance', action.payload.showBalance.toString())
      state.showBalance = action.payload.showBalance
    },
    setShowValueInUsdReduce: (
      state,
      action: PayloadAction<{
        status: VALUE_IN_USD_STATUS
      }>
    ) => {
      localStorage.setItem('showValueInUsd', action.payload.status.toString())
      state.showValueInUsd = action.payload.status
    }
  }
})

// Actions
export const {
  setScanApiKeyReduce,
  setSlippageReduce,
  setDeleverageChanceReduce,
  setMaxInterestRateReduce,
  setMinLiquidityReduce,
  setSortPoolBuyReduce,
  setShowBalanceReduce,
  setShowValueInUsdReduce
} = tokens.actions

export default tokens.reducer
