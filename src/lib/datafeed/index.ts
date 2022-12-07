import historyProvider, { CandleType } from './historyProvider'
import { LASTEST_BLOCK_NUMBER } from '../../utils/constant'
import { store } from '../../state'
import { addTokensReduce } from '../../state/token/reducer'
import { setChartIsOutDate } from '../../state/currentPool/reducer'

const supportedResolutions = ['1', '5', '15', '60', '240', '1D', '1W']
const configDefault = {
  supported_resolutions: supportedResolutions,
  supports_search: false,
  supports_group_request: false,
  supports_marks: true,
  supports_timescale_marks: true,
  supports_time: true,
  timezone: 'Asia/Bangkok'
}

const TIME_IN_RESOLUTION = {
  1: 60,
  5: 60 * 5,
  15: 60 * 15,
  60: 60 * 60,
  120: 60 * 120,
  240: 60 * 240,
  '1D': 60 * 60 * 24,
  '1W': 7 * 60 * 60 * 24
}

const TIME_TO_UPDATE_CHART = 5000

export const Datafeed = {
  subscribeBarsInterval: {},
  inputAddress: '',
  outputAddress: '',
  exchange: 'pancake2',
  lastCandle: {},
  realTimeCandle: {},
  onReady: (callback: any) => {
    console.log('=====onReady running====')
    const config = {
      ...configDefault
    }

    setTimeout(() => callback(config), 0)
  },

  resolveSymbol: async function (
    symbolInfo: any,
    onSymbolResolvedCallback: any,
    _onResolveErrorCallback: any,
    extension: any
  ) {
    console.log('======resolveSymbol running====')
    const [,,, name] = symbolInfo.split('-')
    var symbolStub = {
      name: name,
      description: '',
      type: 'crypto',
      ticker: symbolInfo,
      session: '24x7',
      exchange: '',
      minmov: 1,
      pricescale: 100,
      has_intraday: true,
      supported_resolution: supportedResolutions,
      volume_precision: 8,
      data_status: 'streaming',
      currency_code: extension.currencyCode || 'USD',
      original_currency_code: 'USD'
    }
    onSymbolResolvedCallback(symbolStub)
  },

  getBars: async function (
    symbolInfo: any,
    interval: any,
    periodParams: any,
    onHistoryCallback: any,
    onErrorCallback: any
  ) {
    console.log('=====getBars running======', { periodParams, symbolInfo })
    localStorage.setItem('chart_resolution', interval)

    // const [inputAddress, outputAddress] = detectPairInfo(symbolInfo.ticker)
    const ticker = symbolInfo.ticker
    const [baseAddress, cAddress, quoteAddress] = ticker.split('-')

    historyProvider
      .getBars({
        route: [baseAddress, cAddress, quoteAddress].join(','),
        chainId: 56,
        resolution: interval,
        to: periodParams.to,
        limit: calcLimitCandle(periodParams.from, periodParams.to, interval)
      })
      .then((bars: any) => {
        if (bars.length > 0) {
          // const lastCandle = this.lastCandle[symbol + '-' + interval] || {}
          // console.log('last candle', bars[bars.length - 1].time, lastCandle.time, bars[bars.length - 1].time > lastCandle.time)
          // if (bars[bars.length - 1].time > lastCandle.time || !lastCandle.time) {
          //   this.lastCandle[symbol + '-' + interval] = bars[bars.length - 1]
          //   this.realTimeCandle[symbol + '-' + interval] = bars[bars.length - 1]
          // }

          detectChartIsOutdate(bars[bars.length - 1], interval)

          onHistoryCallback(bars, { noData: false })
        } else {
          onHistoryCallback(bars, { noData: true })
        }
      })
      .catch((err: any) => {
        onErrorCallback(err)
      })
  },

  // TODO: api is being paused, need to test later
  subscribeBars: function (
    symbolInfo: any,
    resolution: any,
    onRealtimeCallback: any,
    subscriberUID: any,
    _onResetCacheNeededCallback: any
  ) {
    console.log('===========subscribeBars==========')
    this.subscribeBarsInterval[subscriberUID] = setInterval(() => {
      const ticker = symbolInfo.ticker
      const [baseAddress, cAddress, quoteAddress] = ticker.split('-')
      historyProvider
        .getBars({
          route: [baseAddress, cAddress, quoteAddress].join(','),
          chainId: 56,
          resolution,
          limit: 2,
          to: LASTEST_BLOCK_NUMBER
        })
        .then((data: any) => {
          if (data.length > 0) {
            const candle = data[data.length - 1]
            const lastCandle = { ...this.lastCandle[baseAddress + '-' + quoteAddress + '-' + resolution] }

            if (candle.time > lastCandle.time) {
              if (data[data.length - 2]) {
                onRealtimeCallback({
                  time: data[data.length - 2].time,
                  open: data[data.length - 2].open,
                  close: data[data.length - 2].close,
                  low: data[data.length - 2].low,
                  high: data[data.length - 2].high,
                  volume: data[data.length - 2].volume
                })
              }

              this.lastCandle[baseAddress + '-' + quoteAddress + '-' + resolution] = { ...candle }
            }

            detectChartIsOutdate(candle, resolution)
            onRealtimeCallback(candle)
          }
        })
        .catch((e) => {
          console.error(e)
        })
    }, TIME_TO_UPDATE_CHART)
  },

  unsubscribeBars: function (subscriberUID: string) {
    if (this.subscribeBarsInterval[subscriberUID]) {
      clearInterval(this.subscribeBarsInterval[subscriberUID])
    }
  }
}

const detectChartIsOutdate = (lastCandle: CandleType, resolution: string) => {
  // const state = store.getState()
  const nextCandleTime = Number(lastCandle.time) + TIME_IN_RESOLUTION[resolution] * 1000
  const now = new Date().getTime()

  const isOutDate = nextCandleTime + 60000 < now

  store.dispatch(setChartIsOutDate({ status: isOutDate }))
}

const calcLimitCandle = (
  fromTime: number,
  toTime: number,
  resolution: string
) => {
  const timeInCandle = TIME_IN_RESOLUTION[resolution]
  if (!timeInCandle) return 320
  return Math.floor((toTime - fromTime) / timeInCandle) + 20
}
