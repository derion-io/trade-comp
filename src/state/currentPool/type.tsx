import { BigNumber } from 'ethers'
import { TokenType } from '../token/type'
import { TRADE_TYPE } from '../../utils/constant'

export enum CHART_TABS {
  FUNC_PLOT,
  CANDLE_CHART,
  LINE_CHART
}

export interface currentPoolState {
  id: string
  UTR: string
  TOKEN: string
  pools: {[key: string]: any}
  currentPoolAddress: string
  drA: number
  drB: number
  drC: number
  pair: {
    token0?: TokenType,
    token1?: TokenType
  }
  ORACLE: string
  TOKEN_R: string
  baseToken: string
  quoteToken: string
  basePrice: number
  powers: number[]
  dTokens: string[]
  allTokens: string[]
  states: {
    twap?: BigNumber
    spot?: BigNumber
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
  chartTab: CHART_TABS
  tradeType: TRADE_TYPE
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
  drA: 0,
  drB: 0,
  drC: 0,
  currentPoolAddress: '',
  chartTab: CHART_TABS.CANDLE_CHART,
  tradeType: TRADE_TYPE.LONG,
  pair: {
    token0: undefined,
    token1: undefined
  },
  baseToken: '',
  quoteToken: '',
  basePrice: 0,
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
