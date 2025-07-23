// eslint-disable-next-line no-unused-vars
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {initialState, LastRoundCache, PriceFeedDataCache} from "./type"
export const tokens = createSlice({
  name: 'linechart',
  initialState,
  reducers: {
    setPriceData: (
      state,
      action: PayloadAction<{
        priceData: PriceFeedDataCache
      }>
    ) => {
      if (Object.keys(action.payload.priceData ?? {}).length === 0) return
      state.priceData = action.payload.priceData
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
    setPriceData,
    setLatestRoundCache,
} = tokens.actions

export default tokens.reducer
