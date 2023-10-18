import { SwapStepType } from 'derivable-tools/dist/types'
import { BigNumber } from 'ethers'

export type BalancesType = { [key: string]: BigNumber }
export type AllowancesType = { [key: string]: BigNumber }
export type MaturitiesType = { [key: string]: BigNumber }
export type SwapTxType = {
  transactionHash: string
  timeStamp: number
  blockNumber: number
  poolIn: string
  poolOut: string
  tokenIn: string
  tokenOut: string
  payer: string
  recipient: string
  sideIn: BigNumber
  sideOut: BigNumber
  amountIn: BigNumber
  amountOut: BigNumber
  entryPrice: string
  entryValue: string
}
export type SwapPendingTxType = {
 hash: string,
 steps: SwapStepType[]
}

export interface walletState {
  account: string
  balances: BalancesType
  maturities: MaturitiesType
  swapLogs: { [key: string]: any[] }
  transferLogs: { [key: string]: any[] }
  formartedSwapLogs: any[]
  routerAllowances: AllowancesType
  swapPendingTxs: SwapPendingTxType[]
}
export const initialState: walletState = {
  account: '',
  balances: {},
  maturities: {},
  swapLogs: {},
  swapPendingTxs: [],
  transferLogs: {},
  formartedSwapLogs: [],
  routerAllowances: {}
}
