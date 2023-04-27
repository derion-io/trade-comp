import { BigNumber } from 'ethers'
import { TokenType } from '../token/type'

export interface currentPoolState {
  id: string
  UTR: string
  TOKEN: string
  pools: {[key: string]: any}
  pair: {
    token0?: TokenType,
    token1?: TokenType
  }
  ORACLE: string
  TOKEN_R: string
  powers: number[]
  dTokens: string[]
  allTokens: string[]
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
  pair: {
    token0: undefined,
    token1: undefined
  },
  TOKEN_R: '',
  powers: [],
  dTokens: [],
  allTokens: [],
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
