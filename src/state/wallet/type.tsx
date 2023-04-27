import { BigNumber } from 'ethers'

export type BalancesType = { [key: string]: BigNumber }
export type AllowancesType = { [key: string]: BigNumber }
export type SwapTxType = {
  transactionHash: string,
  timeStamp: number,
  blockNumber: number,
  poolIn: string,
  poolOut: string,
  tokenIn: string,
  tokenOut: string,
  payer: string,
  recipient: string,
  sideIn: BigNumber,
  sideOut: BigNumber,
  amountIn: BigNumber,
  amountOut: BigNumber
}

export interface walletState {
  account: string
  balances: BalancesType
  swapLogs: {[key: string]: any[] }
  formartedSwapLogs: any[]
  routerAllowances: AllowancesType
}

export const initialState: walletState = {
  account: '',
  balances: {},
  swapLogs: {},
  formartedSwapLogs: [],
  routerAllowances: {}
}
