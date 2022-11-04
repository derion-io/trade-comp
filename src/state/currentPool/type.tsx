export interface currentPoolState {
  baseToken: string
  quoteToken: string
  cToken: string
  dTokens: string[]
  logicAddress?: string
  cTokenPrice: string
  states: any
  powers: number[]
}

export const initialState: currentPoolState = {
  baseToken: '',
  quoteToken: '',
  cToken: '',
  dTokens: [],
  logicAddress: undefined,
  cTokenPrice: '0',
  states: {},
  powers: []
}
