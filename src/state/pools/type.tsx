import { BigNumber } from 'ethers'

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
}

export interface poolsState {
  pools: {
    [key: number]: {[key: string]: PoolType}
  }
}

export const initialState: poolsState = {
  pools: {
    56: {},
    31337: {}
  }
}
