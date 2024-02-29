import { BigNumber } from 'ethers'
import { max } from './helpers'
import { PoolType } from '../state/resources/type'
import { POSITION_STATUS } from './constant'

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

export const Q128 = BigNumber.from(1).shl(128)
export const Q256 = BigNumber.from(1).shl(256)

export class ClosingFeeCalculator {
  MATURITY: number
  MATURITY_VEST: number
  MATURITY_RATE: BigNumber
  maturity: number

  constructor(props: {} = {}) {
    Object.assign(this, props)
  }

  calculateFee(now?: number): {
    fee: number
    remain?: number
    isVesting?: boolean
  } {
    if (now == null) {
      now = Math.floor(new Date().getTime() / 1000)
    }
    if (this.maturity < now) {
      return {
        fee: 0,
        remain: 0,
        isVesting: false,
      }
    }
    const matured = max(this.maturity, now)
    const vested = max(matured - this.MATURITY + this.MATURITY_VEST, now)

    let fee = this.MATURITY_RATE.isZero()
      ? 0
      : Q128.sub(this.MATURITY_RATE).mul(10000).div(Q128).toNumber() / 10000

    if (this.MATURITY_VEST > 0 && vested > now) {
      fee += ((1 - fee) * (vested - now)) / this.MATURITY_VEST
      fee = Math.min(1, fee)
      return {
        fee,
        remain: vested - now,
        isVesting: true
      }
    } else if (this.MATURITY > 0 && matured > now) {
      return {
        fee,
        remain: matured - now,
        isVesting: false
      }
    }
    return {
      fee: 0
    }
  }
}
export type PoolSearch = {
  baseToken: {
    name: string
    symbol: string
    address: string,
    logoURI: string
  },
  quoteToken: {
    name: string
    symbol: string
    address: string,
    logoURI: string
  }
  pools: PoolType[]
}

export type Position = {
  status: POSITION_STATUS
  poolAddress: string
  token: string
  pool: PoolType
  side: number
  balance: BigNumber
  entryValueR: string
  entryValueU: string
  entryPrice: string
  valueRLinear?: string
  valueRCompound?: string
  sizeDisplay: string
  valueU: string
  valueR: string
  currentPrice: string
  dgA: number
  dgB: number
  leverage: number
  effectiveLeverage: number
  funding: number
  calulateClosingFee: (now?: number) => any
}
