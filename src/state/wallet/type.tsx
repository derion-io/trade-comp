import { BigNumber } from 'ethers'

export type BalancesType = { [key: string]: BigNumber }
export type AllowancesType = { [key: string]: BigNumber }
export type SwapTxType = {
  transactionHash: string,
  timeStamp: number,
  oldBalances: {[key: number]: BigNumber},
  newBalances: {[key: number]: BigNumber},
  cAmount: BigNumber,
  cp: BigNumber,
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
