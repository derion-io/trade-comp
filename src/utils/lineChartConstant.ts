export const DATE_FORMATS = {
  HOUR: 'HH:mm',
  DAY: 'MMM-DD',
  FULL: 'YYYY-MM-DD, HH:mm'
}

export const I_5M = '5m'
export const I_30M = '30m'
export const I_1D = '1d'
export const I_1W = '1w'

export type LineChartIntervalType =
  | typeof I_5M
  | typeof I_30M
  | typeof I_1D
  | typeof I_1W

export const INTERVALS_TAB = [
  {
    name: '5M',
    value: I_5M
  },
  {
    name: '30M',
    value: I_30M
  },
  {
    name: '1D',
    value: I_1D
  },
  {
    name: '1W',
    value: I_1W
  },
]

export const LINE_CHART_CONFIG = {
  [I_5M]: {
    type: 'hourlySnapshots',
    range: 24 * 60 * 60 * 1000, // 24 hours
    limit: 100,
    interval: 5 * 60 * 1000,
  },
  [I_30M]: {
    type: 'dailySnapshots',
    range: 24 * 60 * 60 * 1000, // 24 hours
    limit: 100,
    interval: 30 * 60 * 1000,
  },
  [I_1D]: {
    type: 'hourlySnapshots',
    range: 30 * 24 * 60 * 60 * 1000, // 24 hours
    limit: 100,
    interval: 24 * 60 * 60 * 1000,
  },
  [I_1W]: {
    type: 'hourlySnapshots',
    range: 90 * 24 * 60 * 60 * 1000, // 24 hours
    limit: 100,
    interval: 7 * 24 * 60 * 60 * 1000,
  },
}
