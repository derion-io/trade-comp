// import configs from '../config/configs'

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

type ListTokensType = { [key: string]: TokenType }

export interface tokensState {
  tokens: {
    [key: number]: ListTokensType
  }
}

export const initialState: tokensState = {
  tokens: {
    56: {},
    42161: {},
    31337: {},
    97: {}
  }
}
