import { BigNumber } from 'ethers'

export type BalancesType = { [key: string]: BigNumber }
export type AllowancesType = { [key: string]: BigNumber }

export interface walletState {
  account: string
  balances: BalancesType
  routerAllowances: AllowancesType
}

export const initialState: walletState = {
  account: '',
  balances: {},
  routerAllowances: {}
}
