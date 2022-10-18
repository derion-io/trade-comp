// eslint-disable-next-line no-unused-vars
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { initialState } from './type'
export const tokens = createSlice({
  name: 'configs',
  initialState,
  reducers: {
    setConfigs: (state, action: PayloadAction<{
      chainId: number,
      theme: 'light' | 'dark',
      useSubPage: any,
      language: string,
      location: any,
      useHistory: any,
      env: 'development' | 'production'
    }>) => {
      state.chainId = action.payload.chainId
      state.env = action.payload.env
      state.language = action.payload.language
      state.useSubPage = action.payload.useSubPage
      state.theme = action.payload.theme
      state.theme = action.payload.theme
      state.location = action.payload.location
      state.useHistory = action.payload.useHistory
    },
  }
})

// Actions
export const {
  setConfigs
} = tokens.actions

export default tokens.reducer
