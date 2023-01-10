import { BigNumber } from 'ethers'
import { ListTokensType } from '../token/type'
import { DdlResource } from 'derivable-tools/dist/pools'

export type BalancesType = { [key: string]: BigNumber }
export type AllowancesType = { [key: string]: BigNumber }

export type ParseLogType = {
  address: string
  name: string
  topic: string
  args: any
}
export type PoolType = {
  pool: string,
  logic: string,
  cTokenPrice: number,
  baseSymbol: string
  states: any
  baseToken: string,
  quoteToken: string,
  cToken: string,
  powers: number[]
  dTokens: string[]
  priceToleranceRatio: BigNumber
  quoteSymbol: string
  rentRate: BigNumber
  deleverageRate: BigNumber
  poolAddress: string
  quoteId: number,
  baseId: number,
  basePrice: string
  cPrice: number
}

export interface poolsState {
  pools: {
    [key: number]: {[key: string]: PoolType}
  },
  tokens: {
    [key: string]: ListTokensType
  },
  swapLogs: {[key: string]: any[] },
  ddlResource?: DdlResource
}

export const initialState: poolsState = {
  pools: {
    56: {},
    31337: {},
    97: {}
  },
  tokens: {
    56: {},
    31337: {},
    97: {}
  },
  swapLogs: {
  }
}
