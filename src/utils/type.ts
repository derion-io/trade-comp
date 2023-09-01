import { BigNumber } from 'ethers'

export type StepType = {
  tokenIn: string
  tokenOut: string
  amountIn: BigNumber
}

export type SwapStepType = {
  tokenIn: string
  tokenOut: string
  amountIn: BigNumber
  amountOutMin: BigNumber | string | number
}

export type PoolErc1155StepType = {
  idIn: BigNumber | string
  idOut: BigNumber | string
  amountIn: BigNumber
  amountOutMin: BigNumber | string | number
}
