// eslint-disable-next-line no-unused-vars
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { initialState } from './type'
import { Engine } from 'derivable-tools/dist/engine'
import { INetworkConfig } from 'derivable-tools/dist/utils/configs'
export const tokens = createSlice({
  name: 'configs',
  initialState,
  reducers: {
    setConfigs: (
      state,
      action: PayloadAction<{
        // chainId: number
        useSubPage: any
        language: string
        location: any
        useHistory: any
        env: 'development' | 'production'
      }>
    ) => {
      // state.chainId = action.payload.chainId
      state.env = action.payload.env
      state.language = action.payload.language
      state.useSubPage = action.payload.useSubPage
      state.location = action.payload.location
      state.useHistory = action.payload.useHistory
      state.initialledConfig = true
    },

    seNetworkConfigs: (
      state,
      action: PayloadAction<{
        chainId: number
        configs: INetworkConfig
        engine: Engine
      }>
    ) => {
      state.chainId = action.payload.chainId
      state.configs = action.payload.configs
      state.engine = action.payload.engine
    },

    setEngine: (
      state,
      action: PayloadAction<{
        engine: Engine
      }>
    ) => {
      state.engine = action.payload.engine
    }
  }
})

// Actions
export const { setConfigs, setEngine, seNetworkConfigs } = tokens.actions

export default tokens.reducer
