import { SwapStepType } from 'derivable-tools/dist/types'
import { BigNumber } from 'ethers'
import { bn } from '../../utils/helpers'

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
  swapPendingTxs: [{
    hash: '0x00ca9d1f5c469c41220c5b4929311cb1579477f0e39a201b3bc5e76ffc8a0ea4',
    steps: [
      {
        tokenIn: '0xa70926b457618DD7F7a181a5B1b964208159fdD6',
        tokenOut: '0x5093126c4c3f7380cC353b6aB0c7D9E00d4Bd468-16',
        amountIn: bn({
          type: 'BigNumber',
          hex: '0x02b5e3af16b1880000'
        }),
        amountOutMin: '277966066410449639097',
        payloadAmountIn: bn({
          type: 'BigNumber',
          hex: '0x02b5e3af16b1880000'
        }),
        useSweep: true,
        currentBalanceOut: bn({
          type: 'BigNumber',
          hex: '0x2b0722c803c6ad34b1'
        })
      }
    ]
  },
  {
    hash: '0xf8133eb44cf0079182ef0e7ad118b6fbfe70734b816dd7e159c406f5ffc30042',
    steps: [
      {
        tokenIn: '0xa70926b457618DD7F7a181a5B1b964208159fdD6',
        tokenOut: '0x3e235A0D8EeEdF7d942B0bcDD29DB2a83dB90B32-16',
        amountIn: bn({
          type: 'BigNumber',
          hex: '0x01158e460913d00000'
        }),
        amountOutMin: '120121094451984740211',
        payloadAmountIn: bn({
          type: 'BigNumber',
          hex: '0x01158e460913d00000'
        }),
        useSweep: true,
        currentBalanceOut: bn({
          type: 'BigNumber',
          hex: '0x03'
        })
      }
    ]
  }
  ],
  transferLogs: {},
  formartedSwapLogs: [],
  routerAllowances: {}
}
