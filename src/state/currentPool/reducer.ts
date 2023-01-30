// eslint-disable-next-line no-unused-vars
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { initialState } from './type'

export const tokens = createSlice({
  name: 'pool',
  initialState,
  reducers: {
    setChartIsOutDate: (state, action: PayloadAction<{
      status: boolean
    }>) => {
      state.chartIsOutDate = action.payload.status
    },
    setCandleChartIsLoadingReduce: (state, action: PayloadAction<{
      status: boolean
    }>) => {
      state.candleChartIsLoading = action.payload.status
    },
    setCurrentPoolInfo: (
      state,
      action: PayloadAction<{
        baseToken: string
        quoteToken: string
        cToken: string
        cTokenPrice: number
        basePrice: string
        baseId: number
        quoteId: number
        dTokens: string[]
        logicAddress?: string
        states: any,
        powers: number[]
        // changedIn24h: number
        poolAddress: string
      }>
    ) => {
      state.cTokenPrice = action.payload.cTokenPrice
      state.cToken = action.payload.cToken
      state.dTokens = action.payload.dTokens
      state.logicAddress = action.payload.logicAddress
      state.states = action.payload.states
      state.powers = action.payload.powers
      state.baseToken = action.payload.baseToken
      state.quoteToken = action.payload.quoteToken
      state.basePrice = action.payload.basePrice
      // state.changedIn24h = action.payload.changedIn24h
      state.poolAddress = action.payload.poolAddress
      state.baseId = action.payload.baseId
      state.quoteId = action.payload.quoteId
    },
    setChartTimeRange: (state, action: PayloadAction<{
      timeRange: {from: number, to: number}
    }>) => {
      state.chartTimeRange = action.payload.timeRange
    },
    setChartTimeFocusReduce: (state, action: PayloadAction<{
      time: number
    }>) => {
      state.chartTimeFocus = action.payload.time
    },
    setChartIntervalIsUpdated: (state, action: PayloadAction<{
      status: boolean
    }>) => {
      state.chartResolutionIsUpdated = action.payload.status
    }
  }
})

// Actions
export const {
  setChartTimeFocusReduce,
  setChartIsOutDate,
  setCurrentPoolInfo,
  setCandleChartIsLoadingReduce,
  setChartTimeRange,
  setChartIntervalIsUpdated
} = tokens.actions

export default tokens.reducer
