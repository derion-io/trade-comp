// eslint-disable-next-line no-unused-vars
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { initialState, TokenType } from './type'
export const tokens = createSlice({
  name: 'tokens',
  initialState,
  reducers: {
    addTokensReduce: (
      state,
      action: PayloadAction<{
        tokens: TokenType[]
        chainId: number
      }>
    ) => {
      if (action.payload.tokens.length === 0) return
      const newToken = {}
      const tokens = action.payload.tokens
      for (let i = 0; i < tokens.length; i++) {
        newToken[tokens[i].address] = tokens[i]
      }
      console.log('New token: ', newToken)
      state.tokens[action.payload.chainId] = {
        ...state.tokens[action.payload.chainId],
        ...newToken
      }
      console.log(
        'State token after merge: ',
        state.tokens[action.payload.chainId]
      )
    }
  }
})

// Actions
export const { addTokensReduce } = tokens.actions

export default tokens.reducer
