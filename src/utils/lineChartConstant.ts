export const DATE_FORMATS = {
  HOUR: 'HH:mm',
  DAY: 'MMM-DD',
  FULL: 'YYYY-MM-DD, HH:mm'
}

export const I_1D = '1D'
export const I_1W = '1W'
export const I_1M = '1M'
export const I_6M = '6M'
export const I_1Y = '1Y'

export type LineChartIntervalType =
  | typeof I_1D
  | typeof I_1W
  | typeof I_1M
  | typeof I_6M
  | typeof I_1Y

export const INTERVALS_TAB = [
  {
    name: '1D',
    value: I_1D
  },
  {
    name: '1W',
    value: I_1W
  },
  {
    name: '1M',
    value: I_1M
  },
  {
    name: '6M',
    value: I_6M
  },
  {
    name: '1Y',
    value: I_1Y
  },
]

export const LINE_CHART_CONFIG = {
  [I_1D]: {
    type: 'hourlySnapshots',
    range: 24 * 60 * 60 * 1000,
    stepRound: 5,
    limit: 100,
    interval: 5 * 60 * 1000,
    preLoadInterval: I_1W,
    format: 'HH:mm',
  },
  [I_1W]: {
    type: 'dailySnapshots',
    range: 7 * 24 * 60 * 60 * 1000,
    limit: 100,
    stepRound: 35,
    interval: 30 * 60 * 1000,
    preLoadInterval: I_1M,
    format: 'MMM-DD HH:mm',
  },
  [I_1M]: {
    type: 'hourlySnapshots',
    range: 30 * 24 * 60 * 60 * 1000,
    limit: 100,
    stepRound: 10,
    preLoadInterval: I_6M,
    interval: 60 * 60 * 1000,
    format: 'MMM-DD HH:mm',
  },
  [I_6M]: {
    type: 'hourlySnapshots',
    range: 183 * 24 * 60 * 60 * 1000,
    limit: 100,
    preLoadInterval: I_1Y,
    stepRound: 40,
    interval: 4 * 60 * 60 * 1000,
    format: 'MMM-DD HH:mm',
  },
  [I_1Y]: {
    type: 'hourlySnapshots',
    range: 365 * 24 * 60 * 60 * 1000,
    limit: 100,
    stepRound: 240,
    preLoadInterval: I_1Y,
    interval: 24 * 60 * 60 * 1000,
    format: 'MMM-DD',
  },
}
export const CACHE_LATEST_ROUND_TIME  = 5 * 60 * 1000
export const INTERVAL_TO_GECKO = {
  '1D': { timeframe: 'minute', aggregate: 5 },
  '1W': { timeframe: 'minute', aggregate: 15 },
  '1M': { timeframe: 'hour', aggregate: 1 },
  '6M': { timeframe: 'hour', aggregate: 4 },
  '1Y': { timeframe: 'day', aggregate: 1 },
};

export function encodeCLFeedCacheKey(feedAddress: string, roundId: string | number): string {
  return `${feedAddress}-${roundId}`;
}

export function decodeCLFeedCacheKey(key: string): { feedAddress: string; roundId: string } {
  const lastDashIndex = key.lastIndexOf('-');
  if (lastDashIndex === -1) {
    throw new Error('Invalid cache key format');
  }
  return {
    feedAddress: key.slice(0, lastDashIndex),
    roundId: key.slice(lastDashIndex + 1),
  };
}
