export const LARGE_VALUE =
  '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
export const NATIVE_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
export const fee10000 = 30
export const MINI_SECOND_PER_DAY = 86400000
export const LP_PRICE_UNIT = 10000
export const TIME_TO_REFRESH_STATE = 30000
export const DEFAULT_CHAIN = 1337
export const CHAINS = {
  LOCAL: 31337,
  GANACHE: 1337,
  BSC: 56
}

export const LOCALSTORAGE_KEY = {
  DDL_LOGS: 'ddl-log-v1.0',
  LAST_BLOCK_DDL_LOGS: 'last-block-ddl-log-v1.0',
  SWAP_LOGS: 'swap-log-v1.0',
  SWAP_BLOCK_LOGS: 'last-block-swap-log-v1.0'
}

export const SWAP_TAB = {
  EXPOSURE: Symbol('exposure'),
  SWAP: Symbol('swap')
}

export const LIQUIDITY_TAB = {
  ADD: Symbol('add'),
  REMOVE: Symbol('remove')
}

export const CHART_API_ENDPOINT = 'https://api.lz.finance/56/chart/'
export const LASTEST_BLOCK_NUMBER = 99999999999999999

export const POOL_IDS = {
  cToken: 131072,
  cp: 65536,
  token0: 262144,
  token1: 262145,
  native: '0x000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
}

export const COLORS = {
  BUY: '#3DBAA2',
  SELL: '#FF7A68'
}
