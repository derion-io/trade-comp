import historyProvider, { CandleType } from 'derivable-tools/dist/historyProvider'
import { LASTEST_BLOCK_NUMBER, NATIVE_ADDRESS, POOL_IDS } from '../../utils/constant'
import { store } from '../../state'
import {
  setCandleChartIsLoadingReduce, setChartIntervalIsUpdated,
  setChartIsOutDate
} from '../../state/currentPool/reducer'
import { formatWeiToDisplayNumber } from '../../utils/formatBalance'
import { formatFloat, isErc1155Address } from '../../utils/helpers'
import { TokenType } from '../../state/token/type'
import { SwapTxType } from '../../state/wallet/type'
import { currentPoolState } from '../../state/currentPool/type'
import moment from 'moment'

const COLORS = {
  PINK: '#FF98E5',
  BLUE: '#01A7FA',
  BUY: '#3DBAA2',
  SELL: '#FF7A68'
}

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

export const TIME_IN_RESOLUTION = {
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

  resolveSymbol: async function(
    symbolInfo: any,
    onSymbolResolvedCallback: any,
    _onResolveErrorCallback: any,
    extension: any
  ) {
    console.log('======resolveSymbol running====')
    const [, , , name, , priceScale] = symbolInfo.split('-')
    console.log(priceScale, Math.pow(10, priceScale))
    var symbolStub = {
      name: name,
      description: '',
      type: 'crypto',
      ticker: symbolInfo,
      session: '24x7',
      exchange: '',
      minmov: 1,
      pricescale: Math.pow(10, priceScale),
      has_intraday: true,
      supported_resolution: supportedResolutions,
      volume_precision: 8,
      data_status: 'streaming',
      currency_code: extension.currencyCode || 'USD',
      original_currency_code: 'USD'
    }
    onSymbolResolvedCallback(symbolStub)
  },

  getBars: async function(
    symbolInfo: any,
    interval: any,
    periodParams: any,
    onHistoryCallback: any,
    onErrorCallback: any
  ) {
    console.log('=====getBars running======', { periodParams, symbolInfo })
    localStorage.setItem('chart_resolution', interval)

    const state = store.getState()
    const ticker = symbolInfo.ticker
    const [baseAddress, cAddress, quoteAddress, , chainId] = ticker.split('-')
    const tokens = state.tokens.tokens[chainId]

    const limit = calcLimitCandle(periodParams.from, periodParams.to, interval)

    if (periodParams.firstDataRequest) {
      store.dispatch(setChartIntervalIsUpdated({ status: false }))
    }

    historyProvider
      .getBars({
        route: [baseAddress, cAddress, quoteAddress].join(','),
        chainId,
        resolution: interval,
        to: periodParams.to,
        limit: limit,
        inputToken: tokens[baseAddress],
        outputToken: tokens[quoteAddress]
      })
      .then((bars: any) => {
        if (bars.length > 0) {
          if (periodParams.firstDataRequest) {
            store.dispatch(setCandleChartIsLoadingReduce({ status: false }))
            store.dispatch(setChartIntervalIsUpdated({ status: true }))
            detectChartIsOutdate(bars)
          }

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
  subscribeBars: function(
    symbolInfo: any,
    resolution: any,
    onRealtimeCallback: any,
    subscriberUID: any,
    _onResetCacheNeededCallback: any
  ) {
    console.log('===========subscribeBars==========')
    this.subscribeBarsInterval[subscriberUID] = setInterval(() => {
      const state = store.getState()
      const ticker = symbolInfo.ticker
      const [baseAddress, cAddress, quoteAddress, , chainId] = ticker.split('-')
      const tokens = state.tokens.tokens[chainId]

      historyProvider
        .getBars({
          route: [baseAddress, cAddress, quoteAddress].join(','),
          resolution,
          limit: 2,
          chainId,
          to: LASTEST_BLOCK_NUMBER,
          inputToken: tokens[baseAddress],
          outputToken: tokens[quoteAddress]
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

            detectChartIsOutdate(data)
            onRealtimeCallback(candle)
          }
        })
        .catch((e) => {
          console.error(e)
        })
    }, TIME_TO_UPDATE_CHART)
  },

  unsubscribeBars: function(subscriberUID: string) {
    if (this.subscribeBarsInterval[subscriberUID]) {
      clearInterval(this.subscribeBarsInterval[subscriberUID])
    }
  },

  getTimescaleMarks: async function(
    symbolInfo: any,
    from: any,
    to: any,
    onDataCallback: any,
    resolution: any
  ) {
    const state = store.getState()
    const walletTxs = state.wallet.formartedSwapLogs
    const currentPool = state.currentPool
    const configs = state.configs
    const tokens = state.tokens.tokens[configs.chainId]

    const result = walletTxs.map((t: any) => {
      return detectMarkInfo(
        t,
        resolution,
        currentPool,
        tokens,
        configs.configs,
        true
      )
    })
    onDataCallback(result)
  },
  getMarks: async function(
    symbolInfo: any,
    from: any,
    to: any,
    onDataCallback: any,
    resolution: any
  ) {
    const state = store.getState()
    const walletTxs = state.wallet.formartedSwapLogs
    const currentPool = state.currentPool
    const configs = state.configs
    const tokens = state.tokens.tokens[configs.chainId]

    const result = walletTxs.map((t: any) => {
      return detectMarkInfo(
        t,
        resolution,
        currentPool,
        tokens,
        configs.configs
      )
    })
    onDataCallback(result)
  }
}
//
const detectMarkInfo = (
  swapTx: SwapTxType,
  resolution: any,
  currentPool: currentPoolState,
  tokens: { [key: string]: TokenType },
  configs: any,
  timescaleMark = false
) => {
  const time = moment(swapTx.timeStamp * 1000).format('DD/MM/YYYY, hh:mm a')

  const arrow = `<span style='color: ${getColor(swapTx.tokenOut)}'>-></span>`

  const explorerLink = `<a style='color: ${COLORS.BLUE}' target='_blank' href='${configs.explorer}/tx/${swapTx.transactionHash}'>View on Scan</a>`

  const l =
    resolution === '1D' || resolution === '1W' || resolution === '1M'
      ? 1
      : parseInt(resolution)

  const result: any = {
    id: swapTx.transactionHash,
    time: timescaleMark
      ? Math.floor(swapTx.timeStamp)
      : Math.floor(swapTx.timeStamp) - 60 * l
  }
  let label = 'E'

  result.color = getMarkColor(swapTx.tokenOut)

  if (timescaleMark) {
    result.tooltip = [
      'Execute at ' + time,
      `<div>
      <span style='color: ${getColor(swapTx.tokenIn)}'>${tokens[swapTx.tokenIn]?.symbol || 'unknown'}</span>
        ${formatWeiToDisplayNumber(swapTx.amountIn, 4, tokens[swapTx.tokenIn]?.decimal || 18)}
        ${arrow}
        <span style='color: ${getColor(swapTx.tokenOut)}'>${tokens[swapTx.tokenOut]?.symbol || 'unknown'}</span>
        ${formatWeiToDisplayNumber(swapTx.amountOut, 4, tokens[swapTx.tokenIn]?.decimal || 18)}
      </div>`
    ]
  } else {
    label = label.slice(0, 1)
    result.labelFontColor = '#ffffff'
    result.text = `<div>
      <p>Execute at ${time}</p>
      <div>
        <span style='color: ${getColor(swapTx.tokenIn)}'>${tokens[swapTx.tokenIn]?.symbol || 'unknown'}</span>
        ${formatWeiToDisplayNumber(swapTx.amountIn, 4, tokens[swapTx.tokenIn]?.decimal || 18)}
        ${arrow}
        <span style='color: ${getColor(swapTx.tokenOut)}'>${tokens[swapTx.tokenOut]?.symbol || 'unknown'}</span>
        ${formatWeiToDisplayNumber(swapTx.amountOut, 4, tokens[swapTx.tokenIn]?.decimal || 18)}
      </div>
      <div>
        ${explorerLink}
      </div>
    </div>`
  }
  result.label = label
  return result
}

const getColor = (address: string) => {
  console.log(address)
  if (address === NATIVE_ADDRESS || !isErc1155Address(address)) {
    return COLORS.PINK
  }
  const id = address.split('-')[1]
  if (Number(id) === POOL_IDS.C) {
    return COLORS.BLUE
  } else if (Number(id) === POOL_IDS.B) {
    return COLORS.SELL
  } else if (Number(id) === POOL_IDS.A) {
    return COLORS.BUY
  } else {
    return 'white'
  }
}

const getMarkColor = (address: string) => {
  if (address === NATIVE_ADDRESS || !isErc1155Address(address)) {
    return 'pink'
  }
  const id = address.split('-')[1]
  if (Number(id) === POOL_IDS.C) {
    return 'blue'
  } else if (Number(id) === POOL_IDS.B) {
    return 'red'
  } else if (Number(id) === POOL_IDS.A) {
    return 'green'
  } else {
    return 'white'
  }
}

const detectChartIsOutdate = (candles: CandleType[]) => {
  if (candles.length < 2) {
    return
  }
  const range = candles.length - 1
  const first = candles[0]
  const last = candles[range]

  const duration = Number(last.time) - Number(first.time)
  const avg = duration / range

  // twice the average tx time
  const nextTime = Number(last.time) + 2 * avg
  const status = nextTime < new Date().getTime()

  store.dispatch(setChartIsOutDate({ status }))
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
