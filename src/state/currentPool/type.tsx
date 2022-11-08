export interface currentPoolState {
  baseToken: string
  quoteToken: string
  cToken: string
  dTokens: string[]
  logicAddress?: string
  cTokenPrice: string
  states: any
  powers: number[]
  basePrice: string
  changedIn24h: number
  poolAddress: string
}

export const initialState: currentPoolState = {
  baseToken: '',
  quoteToken: '',
  cToken: '',
  dTokens: [],
  logicAddress: undefined,
  cTokenPrice: '0',
  states: {},
  powers: [],
  basePrice: '0',
  changedIn24h: 0,
  poolAddress: '',
}
