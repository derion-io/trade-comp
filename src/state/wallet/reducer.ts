// eslint-disable-next-line no-unused-vars
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  AllowancesType,
  BalancesType,
  initialState,
  SwapPendingTxType,
  MaturitiesType,
  initialAccountState
} from './type'
import _ from 'lodash'

export const tokens = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    // resetBnA: (state) => {
    //   state.mapAccounts[state.account].balances = {}
    //   state.mapAccounts[state.account].routerAllowances = {}
    // },
    resetMapAccount: (state) => {
      state.mapAccounts = {}
    },
    updatePendingSwapTxs: (state, action: PayloadAction<{
      swapPendingTx: SwapPendingTxType[],
      account: string
    }>) => {
      if (!state.mapAccounts[action.payload.account]) state.mapAccounts[action.payload.account] = initialAccountState
      state.mapAccounts[action.payload.account].swapPendingTxs = action.payload.swapPendingTx
    },
    updatePositionsWithEntry: (state, action: PayloadAction<{
      positionsWithEntry: any[],
      account: string
    }>) => {
      if (!state.mapAccounts[action.payload.account]) state.mapAccounts[action.payload.account] = initialAccountState
      state.mapAccounts[action.payload.account].positionsWithEntry = action.payload.positionsWithEntry
    },

    updateSwapTxs: (
      state,
      action: PayloadAction<{
        account: string
        swapLogs: any
        transferLogs: any
      }>
    ) => {
      if (!action.payload.account) return
      if (!state.mapAccounts[action.payload.account]) state.mapAccounts[action.payload.account] = initialAccountState
      if (action.payload.swapLogs[0]?.args?.[0] !== action.payload.account) return
      const _swapsLogs = state.mapAccounts[action.payload.account].swapLogs
        ? [
          ...action.payload.swapLogs,
          ...state.mapAccounts[action.payload.account].swapLogs
        ]
        : action.payload.swapLogs

      const _transferLogs = state.mapAccounts[action.payload.account].transferLogs
        ? [
          ...action.payload.transferLogs,
          ...state.mapAccounts[action.payload.account].transferLogs
        ]
        : action.payload.transferLogs

      state.mapAccounts[action.payload.account].swapLogs = _.uniqBy(
        _swapsLogs?.filter((s:any) => s?.args?.[0] === action.payload.account),
        (l:any) => l?.transactionHash + l?.logIndex
      )
      state.mapAccounts[action.payload.account].transferLogs = _.uniqBy(
        _transferLogs,
        (l:any) => l?.transactionHash + l?.logIndex
      )
    },

    updateFormatedSwapTxs: (
      state,
      action: PayloadAction<{
        account: string,
        swapTxs: any
      }>
    ) => {
      if (!state.mapAccounts[action.payload.account]) state.mapAccounts[action.payload.account] = initialAccountState
      if (action.payload.swapTxs[0]?.payer !== action.payload.account) return
      state.mapAccounts[action.payload.account].formartedSwapLogs = _.uniqBy(
        action.payload.swapTxs?.filter((s:any) => s?.payer === action.payload.account),
        (l: any) => l.transactionHash + l?.logIndex
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
      if (!state.mapAccounts[action.payload.account]) state.mapAccounts[action.payload.account] = initialAccountState
      state.mapAccounts[action.payload.account].balances = action.payload.balances
      state.mapAccounts[action.payload.account].routerAllowances = action.payload.routerAllowances
      state.mapAccounts[action.payload.account].maturities = action.payload.maturities
      state.account = action.payload.account // only used for tradingview markers
    }
  }
})

// Actions
export const {
  // resetBnA,
  resetMapAccount,
  updatePositionsWithEntry,
  updateBalanceAndAllowancesReduce,
  updateSwapTxs,
  updatePendingSwapTxs,
  updateFormatedSwapTxs
} = tokens.actions

export default tokens.reducer
