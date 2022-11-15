import { BigNumber } from 'ethers'

export type BalancesType = { [key: string]: BigNumber }
export type AllowancesType = { [key: string]: BigNumber }

export interface poolsState {
  logics: {
    [key: string]: {
      pool: string,
      baseSymbol: string
      baseToken: string,
      cToken: string,
      powers: number[]
      priceToleranceRatio: BigNumber
      quoteSymbol: string
      rentRate: BigNumber
    }
  }
}

export const initialState: poolsState = {
  logics: {}
}
