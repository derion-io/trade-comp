// eslint-disable-next-line no-unused-vars
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { BigNumber } from 'ethers'
import {initialState, LastRoundCache, PriceFeedDataCache} from "./type"
export const tokens = createSlice({
  name: 'linechart',
  initialState,
  reducers: {
    setRoundCache: (
      state,
      action: PayloadAction<{
        cacheData: PriceFeedDataCache
      }>
    ) => {
      if (Object.keys(action.payload.cacheData ?? {}).length === 0) return
      state.roundCache = action.payload.cacheData
    },
    setLatestRoundCache: (
      state,
      action: PayloadAction<{
        cacheData: LastRoundCache
      }>
    ) => {
      if (Object.keys(action.payload.cacheData ?? {}).length === 0) return
      state.lastestRoundCache = action.payload.cacheData
    },
  }
})

// Actions
export const {
    setRoundCache,
    setLatestRoundCache,
} = tokens.actions

export default tokens.reducer
