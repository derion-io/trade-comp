import historyProvider from './historyProvider'

const supportedResolutions = ['1', '5', '15', '60', '240', '1D', '1W', '1M']
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
  5: 60 * 5,
  15: 60 * 15,
  60: 60 * 60,
  120: 60 * 120,
  240: 60 * 240,
  '1D': 60 * 60 * 24
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
    console.log(symbolInfo)
    var symbolStub = {
      name: name,
      description: '',
      type: 'crypto',
      ticker: symbolInfo,
      session: '24x7',
      exchange: '',
      minmov: 1,
      pricescale: 10000,
      has_intraday: true,
      supported_resolution: supportedResolutions,
      volume_precision: 8,
      data_status: 'streaming',
      currency_code: extension.currencyCode || 'USD',
      original_currency_code: 'USD'
    }
    console.log(symbolStub, extension)
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
        console.log('bar', bars)
        if (bars.length > 0) {
          // const lastCandle = this.lastCandle[symbol + '-' + interval] || {}
          // console.log('last candle', bars[bars.length - 1].time, lastCandle.time, bars[bars.length - 1].time > lastCandle.time)
          // if (bars[bars.length - 1].time > lastCandle.time || !lastCandle.time) {
          //   this.lastCandle[symbol + '-' + interval] = bars[bars.length - 1]
          //   this.realTimeCandle[symbol + '-' + interval] = bars[bars.length - 1]
          // }

          onHistoryCallback(bars, { noData: false })
        } else {
          onHistoryCallback(bars, { noData: true })
        }
      })
      .catch((err: any) => {
        onErrorCallback(err)
      })
  }

  // subscribeBars: function (
  //   symbolInfo: any,
  //   resolution: any,
  //   onRealtimeCallback: any,
  //   subscriberUID: any,
  //   _onResetCacheNeededCallback: any
  // ) {
  //   console.log('===========subscribeBars==========')
  //   this.subscribeBarsInterval[subscriberUID] = setInterval(() => {
  //     const ticker = symbolInfo.ticker
  //     const [symbol, chainId] = ticker.split('-')
  //     const now = new Date().getTime() / 1000
  //     historyProvider
  //       .getCurrentPriceBySymbol({
  //         symbol: symbol,
  //         chainId: chainId
  //       })
  //       .then((data: any) => {
  //         const now = new Date().getTime()
  //         const lastCandle = this.lastCandle[symbol + '-' + resolution]
  //         const realtimeCandle = this.realTimeCandle[symbol + '-' + resolution]
  //         const nextCandleTime = realtimeCandle.time + TIME_IN_RESOLUTION[resolution] * 1000
  //
  //         const tradePrice = Number(data)
  //         let bar
  //         if (now >= nextCandleTime) {
  //           bar = {
  //             time: nextCandleTime,
  //             open: realtimeCandle.close,
  //             high: tradePrice,
  //             low: tradePrice,
  //             close: tradePrice
  //           }
  //           console.log('Generate new bar', bar)
  //         } else {
  //           bar = {
  //             ...realtimeCandle,
  //             high: Math.max(realtimeCandle.high, tradePrice),
  //             low: Math.min(realtimeCandle.low, tradePrice),
  //             close: tradePrice
  //           }
  //           console.log('Update the latest bar by price', tradePrice, bar)
  //         }
  //         this.realTimeCandle[symbol + '-' + resolution] = bar
  //         onRealtimeCallback(bar)
  //       })
  //       .catch((e) => {
  //         console.error(e)
  //       })
  //   }, TIME_TO_UPDATE_CHART)
  // },
  // unsubscribeBars: function (subscriberUID: string) {
  //   if (this.subscribeBarsInterval[subscriberUID]) {
  //     clearInterval(this.subscribeBarsInterval[subscriberUID])
  //   }
  // }
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
