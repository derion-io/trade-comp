export interface currentPoolState {
  baseToken: string
  quoteToken: string
  cToken: string
  dTokens: string[]
  logicAddress?: string
  cTokenPrice: number
  states: any
  powers: number[]
  basePrice: string
  changedIn24h: number
  poolAddress: string
  baseId: number,
  quoteId: number,
  chartIsOutDate: boolean
  candleChartIsLoading: boolean
}

export const initialState: currentPoolState = {
  baseToken: '',
  quoteToken: '',
  cToken: '',
  dTokens: [],
  logicAddress: undefined,
  cTokenPrice: 0,
  baseId: 0,
  quoteId: 0,
  states: {},
  powers: [],
  basePrice: '0',
  changedIn24h: 0,
  poolAddress: '',
  chartIsOutDate: false,
  candleChartIsLoading: false
}
