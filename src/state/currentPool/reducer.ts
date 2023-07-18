// eslint-disable-next-line no-unused-vars
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { CHART_TABS, initialState } from './type'
import { TokenType } from '../token/type'
import { TRADE_TYPE } from '../../utils/constant'

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
    setChartTabReduce: (state, action: PayloadAction<{
      tab: CHART_TABS
    }>) => {
      state.chartTab = action.payload.tab
    },
    setSwapTabReduce: (state, action: PayloadAction<{
      tab: TRADE_TYPE
    }>) => {
      state.tradeType = action.payload.tab
    },
    setCurrentPoolInfo: (
      state,
      action: PayloadAction<{
        id: string
        UTR: string
        TOKEN: string
        pools: any
        ORACLE: string
        TOKEN_R: string
        states: any,
        powers: number[]
        dTokens: string[]
        allTokens: string[]
        pair: {
          token0?: TokenType,
          token1?: TokenType
        },
        baseToken: string,
        quoteToken: string,
        basePrice: number,
      }>
    ) => {
      state.id = action.payload.id
      state.UTR = action.payload.UTR
      state.TOKEN = action.payload.TOKEN
      state.pools = action.payload.pools
      state.ORACLE = action.payload.ORACLE
      state.TOKEN_R = action.payload.TOKEN_R
      state.states = action.payload.states
      state.powers = action.payload.powers
      state.dTokens = action.payload.dTokens
      state.allTokens = action.payload.allTokens
      state.pair = action.payload.pair
      state.baseToken = action.payload.baseToken
      state.quoteToken = action.payload.quoteToken
      state.basePrice = action.payload.basePrice
    },
    setChartTimeRange: (state, action: PayloadAction<{
      timeRange: { from: number, to: number }
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
    },
    setCurrentPoolAddressReduce: (state, action: PayloadAction<{
      address: string
    }>) => {
      state.currentPoolAddress = action.payload.address
    },
    setDrReduce: (state, action: PayloadAction<{
      drA: number,
      drB: number,
      drC: number,
    }>) => {
      state.drA = action.payload.drA
      state.drB = action.payload.drB
      state.drC = action.payload.drC
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
  setChartIntervalIsUpdated,
  setChartTabReduce,
  setSwapTabReduce,
  setDrReduce,
  setCurrentPoolAddressReduce
} = tokens.actions

export default tokens.reducer
