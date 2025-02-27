// eslint-disable-next-line no-unused-vars
import {createSlice,PayloadAction} from '@reduxjs/toolkit'
import {initialState} from './type'
import {IUniPosV3} from 'derivable-engine/dist/services/balanceAndAllowance'

export const tokens = createSlice({
  name: 'uni3Pos',
  initialState,
  reducers: {
    setUni3Pos: (
      state,
      action: PayloadAction<{
        key: string
        uni3Pos: IUniPosV3
      }>
    ) => {
      state.uni3Positions[action.payload.key] = action.payload.uni3Pos
    },
    setAllUni3Pos: (
      state,
      action: PayloadAction<{
        uni3Positions: {[key:string]: IUniPosV3}
      }>
    ) => {
      state.uni3Positions = action.payload.uni3Positions
    },
    setCurrentUni3Pos: (
      state,
      action: PayloadAction<{
        uni3Pos: string
      }>
    ) => {
      if(state.uni3Positions[action.payload.uni3Pos])
        state.currentUni3Position = action.payload.uni3Pos
    },
  }
})

// Actions
export const {
  setUni3Pos,
  setAllUni3Pos,
  setCurrentUni3Pos
} = tokens.actions

export default tokens.reducer
