import { SwapStepType } from 'derivable-engine/dist/types'
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
  mapAccounts: {[account: string]: {
    balances: BalancesType,
    maturities: MaturitiesType,
    swapLogs: any[],
    transferLogs: any[],
    formartedSwapLogs: any[],
    routerAllowances: AllowancesType,
    swapPendingTxs: SwapPendingTxType[],
    positionsWithEntry: {[key:string]: any}
  }
},
}
export const initialAccountState = {
  balances: {},
  maturities: {},
  swapLogs: [],
  transferLogs: [],
  formartedSwapLogs: [],
  routerAllowances: {},
  swapPendingTxs: [],
  positionsWithEntry: {}
}
export const initialState = {
  mapAccounts: {}
}
