import { BigNumber } from 'ethers'
// import { ListTokensType } from '../token/type'
// import { SUPPORTED_CHAINS } from '../../utils/constant'

export type PriceFeedData = {
  answer: string
  // startedAt: BigNumber
  updatedAt: number
  // answeredInRound: BigNumber
  // time?: number
}

export type LineChartData = PriceFeedData & {
  roundId: BigNumber
}
export type PriceFeedDataCache = { [chainId: string]: {[feed: string]:{[roundId: string]: PriceFeedData} }}
export type LastRoundCache = {[key:string]:  {
  cacheTime: number
  cacheOutdateTime: number
  round: BigNumber
}}
export type LineChartType={priceData: PriceFeedDataCache;  lastestRoundCache: LastRoundCache }
export const initialState: LineChartType = {
  priceData: {} as PriceFeedDataCache,
  lastestRoundCache: {} as LastRoundCache
}
