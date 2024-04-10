import { BigNumber } from 'ethers'
import { ListTokensType } from '../token/type'
import { SUPPORTED_CHAINS } from '../../utils/constant'

export type BalancesType = { [key: string]: BigNumber }
export type AllowancesType = { [key: string]: BigNumber }

export type ParseLogType = {
  address: string
  name: string
  topic: string
  args: any
}
export type PoolGroupType = any
export type PoolGroupValueType = {[indexKey: string]: {
  poolGroupValue: number
  poolGroupValueR: number
  poolGroupPositionValue: number
  poolGroupPositions: {
    address:string,
    value: number
  }[],
}}
export type PoolType = any
export type FeeDataType = {
  gasPrice: BigNumber
  lastBaseFeePerGas: BigNumber
  maxFeePerGas: BigNumber
  maxPriorityFeePerGas: BigNumber
}
// export type PoolType = {
//   pool: string,
//   logic: string,
//   cTokenPrice: number,
//   baseSymbol: string
//   states: any
//   baseToken: string,
//   quoteToken: string,
//   cToken: string,
//   powers: number[]
//   dTokens: string[]
//   priceToleranceRatio: BigNumber
//   quoteSymbol: string
//   rentRate: BigNumber
//   deleverageRate: BigNumber
//   poolAddress: string
//   quoteId: number,
//   baseId: number,
//   basePrice: string
//   cPrice: number
// }

export interface resourcesState {
  poolGroups: {
    [key: number]: { [key: string]: PoolGroupType }
  }
  pools: {
    [key: number]: { [key: string]: PoolType }
  }
  tokens: {
    [key: string]: ListTokensType
  }
  prices: {
    [key: number]: { [key: string]: string }
  }
  feeData: {
    [key: string]: { [key: string]: FeeDataType }
  },
  swapLogs: { [key: string]: any[] },
  isInitPool: boolean | null
}

const initDataEachChain = Object.fromEntries(
  SUPPORTED_CHAINS.map(chainId => [chainId, {}])
)

export const initialState: resourcesState = {
  poolGroups: initDataEachChain,
  pools: initDataEachChain,
  tokens: initDataEachChain,
  prices: initDataEachChain,
  feeData: initDataEachChain,
  isInitPool: null,
  swapLogs: {}
}
