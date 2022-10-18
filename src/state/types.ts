import { web3ReactState } from './customWeb3React/type'
import { configsState } from './config/type'
import { BigNumber } from 'ethers'

export enum FetchStatus {
  NOT_FETCHED = 'not-fetched',
  SUCCESS = 'success',
  FAILED = 'failed',
  FETCHING = 'fetching',
  FETCHED = 'fetched'
}

export type SerializedBigNumber = string

export interface State {
  configs: configsState,
  web3react: web3ReactState
}

export interface PoolApiType {
  address: string
  address0: string
  address1: string
  creator: string
  reserve0: string
  reserve1: string
}

export interface PoolType {
  address: string
  address0: string
  address1: string
  creator: string
  reserve0: BigNumber
  reserve1: BigNumber
}
