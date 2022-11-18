export interface TokenType {
  decimal: number
  name: string
  symbol: string
  icon?: string
  logo?: string
  address: string
  isWhiteList?: boolean
  isCustomToken?: boolean
  value?: string
  hideInSearchModal?: boolean
}

export interface BlackToken {
  address: string
  reason: string
}

type ListTokensType = { [key: string]: TokenType }

export interface tokensState {
  chainTokens: { [key: number]: ListTokensType }
  tokens: {
    [key: number]: ListTokensType
  }
}

export const initialState: tokensState = {
  chainTokens: {},
  tokens: {
    56: {},
    42161: {}
  }
}
