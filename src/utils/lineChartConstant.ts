export const DATE_FORMATS = {
  HOUR: 'HH:mm',
  DAY: 'MMM-DD',
  FULL: 'YYYY-MM-DD, HH:mm'
}

export const I_5m = '5m'
export const I_30m = '30m'
export const I_1H = '1H'
export const I_4H = '4H'
export const I_1D = '1d'

export type LineChartIntervalType =
  | typeof I_5m
  | typeof I_30m
  | typeof I_1H
  | typeof I_4H
  | typeof I_1D

export const INTERVALS_TAB = [
  {
    name: '5m',
    value: I_5m
  },
  {
    name: '30m',
    value: I_30m
  },
  {
    name: '1H',
    value: I_1H
  },
  {
    name: '4H',
    value: I_4H
  },
  {
    name: '1D',
    value: I_1D
  },
]

export const LINE_CHART_CONFIG = {
  [I_5m]: {
    type: 'hourlySnapshots',
    range: 100 * 5 * 60 * 1000,
    limit: 100,
    interval: 5 * 60 * 1000,
  },
  [I_30m]: {
    type: 'dailySnapshots',
    range: 100 * 30 * 60 * 1000,
    limit: 100,
    interval: 30 * 60 * 1000,
  },
  [I_1H]: {
    type: 'hourlySnapshots',
    range: 100 * 60 * 60 * 1000,
    limit: 100,
    interval: 60 * 60 * 1000,
  },
  [I_4H]: {
    type: 'hourlySnapshots',
    range: 100 * 4 * 60 * 60 * 1000,
    limit: 100,
    interval: 4 * 60 * 60 * 1000,
  },
  [I_1D]: {
    type: 'hourlySnapshots',
    range: 100 * 24 * 60 * 60 * 1000,
    limit: 100,
    interval: 24 * 60 * 60 * 1000,
  },
}
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
