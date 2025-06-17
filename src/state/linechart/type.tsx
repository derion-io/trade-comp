import { BigNumber } from 'ethers'
import { ListTokensType } from '../token/type'
import { SUPPORTED_CHAINS } from '../../utils/constant'
export type PriceFeedData = {
  roundId: BigNumber
  answer: BigNumber
  startedAt: BigNumber
  updatedAt: BigNumber
  answeredInRound: BigNumber
  time?: number
}
export type PriceFeedDataCache = { [roundId: string]: PriceFeedData }
export type LineChartType={roundCache: PriceFeedDataCache}
export const initialState: LineChartType = {
  roundCache: {} as PriceFeedDataCache
}
