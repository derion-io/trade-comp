import { BigNumber } from 'ethers'

export type BalancesType = { [key: string]: BigNumber }
export type AllowancesType = { [key: string]: BigNumber }

export interface walletState {
  account: string
  balances: BalancesType
  swapTxs: {[key: string]: any }
  routerAllowances: AllowancesType
}

export const initialState: walletState = {
  account: '',
  balances: {},
  swapTxs: {},
  routerAllowances: {}
}
