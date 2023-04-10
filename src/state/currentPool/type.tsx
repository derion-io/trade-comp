import { BigNumber } from 'ethers'

export interface currentPoolState {
  id: string
  UTR: string
  TOKEN: string
  pools: {[key: string]: any}
  ORACLE: string
  TOKEN_R: string
  powers: number[]
  dTokens: string[]
  states: {
    twapBase?: BigNumber
    spotBase?: BigNumber
    supplyDetails?: {[key: number]: BigNumber}
    rDetails?: {[key: number]: BigNumber}
    R?: BigNumber
    rC?: BigNumber
    rDcLong?: BigNumber
    rDcShort?: BigNumber
  }
  // baseToken: string
  // quoteToken: string
  // cToken: string
  // dTokens: string[]
  // logicAddress?: string
  // cTokenPrice: number
  // states: any
  // powers: number[]
  // basePrice: string
  // poolAddress: string
  // baseId: number,
  // quoteId: number,
  changedIn24h: number
  chartIsOutDate: boolean
  candleChartIsLoading: boolean
  chartTimeRange: {
    from: number,
    to: number
  },
  chartTimeFocus: number
  chartResolutionIsUpdated: boolean
}

export const initialState: currentPoolState = {
  id: '',
  states: {},
  UTR: '',
  TOKEN: '',
  pools: {},
  ORACLE: '',
  TOKEN_R: '',
  powers: [],
  dTokens: [],
  changedIn24h: 0,
  chartIsOutDate: false,
  candleChartIsLoading: false,
  chartTimeRange: {
    from: 0,
    to: 0
  },
  chartTimeFocus: 0,
  chartResolutionIsUpdated: false
}
