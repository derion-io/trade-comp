import { BigNumber } from 'ethers'

export type BalancesType = { [key: string]: BigNumber }
export type AllowancesType = { [key: string]: BigNumber }
export type SwapTxType = {
  timeStamp: number,
  balances: {[key: number]: BigNumber},
  cAmount: BigNumber,
  newLeverage: number,
  oldLeverage: number,
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
