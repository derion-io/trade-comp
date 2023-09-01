export const DATE_FORMATS = {
  HOUR: 'hh:mm a',
  DAY: 'MMM DD',
  FULL: 'MMM DD, YYYY, hh:mm a'
}

export const I_1D = '1d'
export const I_1W = '1w'
export const I_1M = '1m'
export const I_6M = '6m'

export type LineChartIntervalType =
  | typeof I_1D
  | typeof I_1W
  | typeof I_1M
  | typeof I_6M

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
  }
]

export const LINE_CHART_CONFIG = {
  [I_1D]: {
    type: 'hourlySnapshots',
    limit: 24
  },
  [I_1W]: {
    type: 'hourlySnapshots',
    limit: 168
  },
  [I_1M]: {
    type: 'hourlySnapshots',
    limit: 720
  },
  [I_6M]: {
    type: 'dailySnapshots',
    limit: 180
  }
}
