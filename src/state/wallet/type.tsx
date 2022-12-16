import { BigNumber } from 'ethers'

export type BalancesType = { [key: string]: BigNumber }
export type AllowancesType = { [key: string]: BigNumber }
export type SwapTxType = {
  timestamp: number,
  cAmount: BigNumber,
  oldLeverage: BigNumber,
  newLeverage: BigNumber,
}

export interface walletState {
  account: string
  balances: BalancesType
  swapLogs: {[key: string]: any[] }
  routerAllowances: AllowancesType
}

export const initialState: walletState = {
  account: '',
  balances: {},
  swapLogs: {},
  routerAllowances: {}
}
