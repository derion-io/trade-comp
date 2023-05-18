// eslint-disable-next-line no-unused-vars
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { initialState, PoolType } from './type'
export const tokens = createSlice({
  name: 'pools',
  initialState,
  reducers: {
    addPoolsWithChain: (state, action: PayloadAction<{
      poolGroups: {[key: string]: PoolType},
      chainId: number
    }>) => {
      if (Object.keys(action.payload.poolGroups).length === 0) return
      state.poolGroups[action.payload.chainId] = {
        ...state[action.payload.chainId],
        ...action.payload.poolGroups
      }
    }
  }
})

// Actions
export const {
  addPoolsWithChain
} = tokens.actions

export default tokens.reducer
