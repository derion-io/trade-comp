export const LARGE_VALUE =
  '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
export const NATIVE_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
export const fee10000 = 30
export const MINI_SECOND_PER_DAY = 86400000
export const LP_PRICE_UNIT = 10000
export const TIME_TO_REFRESH_STATE = 30000
export const CHAINS = {
  // ARBITRUM: 42161,
  // BASE: 8453,
  BSC: 56,
}
export const PERCENTAGE_SUGGESTIONS = [10, 25, 50, 75, 100]

export const SUPPORTED_CHAINS = Object.values(CHAINS)
export const DEFAULT_CHAIN = SUPPORTED_CHAINS[0]

export const MIN_POSITON_VALUE_USD_TO_DISPLAY = 0.1

export enum TRADE_TYPE {
  LONG,
  SHORT,
  SWAP,
  LIQUIDITY
}
export enum POSITION_STATUS {
  OPENED,
  OPENING,
  UPDATING,
  CLOSING,
}

export const LOCALSTORAGE_KEY = {
  DDL_LOGS: 'ddl-log-v1.0',
  LAST_BLOCK_DDL_LOGS: 'last-block-ddl-log-v1.0',
  SWAP_LOGS: 'swap-log-v1.0',
  SWAP_BLOCK_LOGS: 'last-block-swap-log-v1.0'
}

export const SWAP_TAB = {
  LONG: Symbol('long'),
  SHORT: Symbol('short'),
  SWAP: Symbol('swap')
}

export const LIQUIDITY_TAB = {
  ADD: Symbol('add'),
  REMOVE: Symbol('remove')
}

export const CHART_API_ENDPOINT = 'https://api.derivable.org/56/chart/'
export const LASTEST_BLOCK_NUMBER = 99999999999999999

export const POOL_IDS = {
  cToken: 131072,
  cp: 65536,
  token0: 262144,
  token1: 262145,
  native: 0x01,
  R: 0x00,
  A: 0x10,
  B: 0x20,
  C: 0x30
}

export const COLORS = {
  BUY: '#3DBAA2',
  SELL: '#FF7A68'
}

export const UNWRAP = {
  'WETH': 'ETH',
  'WBNB': 'BNB',
}
