import { BigNumber } from 'ethers'

export type StepType = {
  tokenIn: string,
  tokenOut: string,
  amountIn: BigNumber
}


export type SwapStepType = {
  tokenIn: string,
  tokenOut: string,
  amountIn: BigNumber
  amountOutMin: BigNumber | string | number
}
