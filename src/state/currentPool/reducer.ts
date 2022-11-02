// eslint-disable-next-line no-unused-vars
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { initialState } from './type'

export const tokens = createSlice({
  name: 'pool',
  initialState,
  reducers: {
    setCurrentPoolInfo: (
      state,
      action: PayloadAction<{
        baseToken: string
        quoteToken: string
        cToken: string
        dTokens: string[]
        logicAddress?: string
        states: any,
        powers: number[]
      }>
    ) => {
      state.cToken = action.payload.cToken
      state.dTokens = action.payload.dTokens
      state.logicAddress = action.payload.logicAddress
      state.states = action.payload.states
      state.powers = action.payload.powers
      state.baseToken = action.payload.baseToken
      state.quoteToken = action.payload.quoteToken
    }
  }
})

// Actions
export const {
  setCurrentPoolInfo
} = tokens.actions

export default tokens.reducer
