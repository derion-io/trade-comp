// eslint-disable-next-line no-unused-vars
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { initialState } from './type'
export const tokens = createSlice({
  name: 'web3React',
  initialState,
  reducers: {
    setAccount: (state, action: PayloadAction<{ account: string }>) => {
      state.account = action.payload.account
    },
    setChainId: (state, action: PayloadAction<{ chainId: any }>) => {
      state.chainId = action.payload.chainId
    },
    setActive: (state, action: PayloadAction<{ active: any }>) => {
      state.active = action.payload.active
    },
    setProvider: (state, action: PayloadAction<{ provider: any }>) => {
      state.provider = action.payload.provider
    },
    setShowWalletModalCallback: (
      state,
      action: PayloadAction<{ callback: () => void }>
    ) => {
      state.showConnectModal = action.payload.callback
    }
  }
})

// Actions
export const {
  setShowWalletModalCallback,
  setChainId,
  setActive,
  setProvider,
  setAccount
} = tokens.actions

export default tokens.reducer
