// eslint-disable-next-line no-unused-vars
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  AllowancesType,
  BalancesType,
  initialState,
  MaturitiesType
} from './type'
import _ from 'lodash'

export const tokens = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    resetBnA: (state) => {
      state.balances = {}
      state.routerAllowances = {}
      state.account = ''
    },
    updateSwapTxs: (
      state,
      action: PayloadAction<{
        account: string
        swapLogs: any
      }>
    ) => {
      if (!action.payload.account) return
      const logs = state.swapLogs[action.payload.account]
        ? [
          ...action.payload.swapLogs,
          ...state.swapLogs[action.payload.account]
        ]
        : action.payload.swapLogs

      state.swapLogs[action.payload.account] = _.uniqBy(logs, (l) => l.logIndex)
    },
    updateFormatedSwapTxs: (
      state,
      action: PayloadAction<{
        swapTxs: any
      }>
    ) => {
      state.formartedSwapLogs = _.uniqBy(
        action.payload.swapTxs,
        (l: any) => l.transactionHash
      )
    },
    updateBalanceAndAllowancesReduce: (
      state,
      action: PayloadAction<{
        balances: BalancesType
        routerAllowances: AllowancesType
        maturities: MaturitiesType
        account: string
      }>
    ) => {
      if (action.payload.account !== state.account) {
        state.balances = action.payload.balances
        state.routerAllowances = action.payload.routerAllowances
        state.maturities = action.payload.maturities
        state.account = action.payload.account
      } else {
        state.balances = {
          ...state.balances,
          ...action.payload.balances
        }
        state.routerAllowances = {
          ...state.routerAllowances,
          ...action.payload.routerAllowances
        }
        state.maturities = {
          ...state.maturities,
          ...action.payload.maturities
        }
      }
    }
  }
})

// Actions
export const {
  resetBnA,
  updateBalanceAndAllowancesReduce,
  updateSwapTxs,
  updateFormatedSwapTxs
} = tokens.actions

export default tokens.reducer
