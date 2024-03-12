import historyProvider, { CandleType } from 'derivable-engine/dist/historyProvider'
import { LASTEST_BLOCK_NUMBER, NATIVE_ADDRESS, POOL_IDS } from '../../utils/constant'
import { store } from '../../state'
import {
  setCandleChartIsLoadingReduce, setChartIntervalIsUpdated,
  setChartIsOutDate,
  setPriceByIndexR
} from '../../state/currentPool/reducer'
import { formatWeiToDisplayNumber } from '../../utils/formatBalance'
import { isErc1155Address } from '../../utils/helpers'
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

const wrappedToNativeSymbol = (symbol?: string): string => {
  if (!symbol) return ''
  const state = store.getState()
  const configs = state.configs.configs
  return symbol === `W${configs.nativeSymbol}` ? configs.nativeSymbol : symbol
}

const handleChartRouteOption = (currencyId: string, baseAddress: string, cAddress: string, quoteAddress: string): {route: (string | undefined)[],isPriceByIndexR: boolean, quoteAddressSelect: string} => {
  const state = store.getState()
  const { routes, configs: { chartReplacements } } = state.configs
  cAddress = chartReplacements?.[cAddress] ?? cAddress
  const defaultStableCoin = state.configs.configs.stablecoins?.[0]
  let quoteAddressSelect = quoteAddress
  const isHavePool = Object.keys(routes).filter(poolRoute => (poolRoute.includes(defaultStableCoin) && poolRoute.includes(state.currentPool.quoteToken)))?.[0]
  const isQuoteStableCoin = state.configs.configs.stablecoins?.some((stable: string) => stable === state.currentPool.quoteToken)
  if (isHavePool && !isQuoteStableCoin) {
    if (currencyId === 'USD') quoteAddressSelect = defaultStableCoin
    else if (currencyId === state.configs.configs.nativeSymbol) quoteAddressSelect = state.currentPool.quoteToken
  }
  const routeKeys = Object.keys(routes).filter(poolRoute => (
    poolRoute.includes(defaultStableCoin) && poolRoute.includes(quoteAddressSelect)
  ))

  const poolAddress = routeKeys.length > 0 ? routes[routeKeys[0]][0]?.address : undefined

  return {
    route: [
      baseAddress,
      cAddress,
      quoteAddress,
      ...(quoteAddressSelect === state.currentPool.quoteToken ? [] : [poolAddress, defaultStableCoin]
      )],
    quoteAddressSelect,
    isPriceByIndexR: quoteAddressSelect !== defaultStableCoin
  }
}

function removeChartAnomaly(bars: any): any {
  const maxAntenaRatio = 2
  for (const bar of bars) {
    const { open, close, low, high } = bar
    const [ top, bottom ] = close > open ? [close, open] : [open, close]
    const limit = (top - bottom) * maxAntenaRatio
    if (limit > 0) {
      if (high > bottom + limit) {
        bar.high = bottom + limit
      }
      if (low < top - limit) {
        bar.low = top - limit
      }
    }
  }
  return bars
}

export const Datafeed = {
  subscribeBarsInterval: {},
  inputAddress: '',
  outputAddress: '',
  exchange: 'pancake2',
  lastCandle: {},
  realTimeCandle: {},
  onReady: (callback: any) => {
    const state = store.getState()
    const { token0, token1 } = state.currentPool.pair
    const quoteTokenSymbol = token0?.address === state.currentPool.quoteToken ? token0.symbol : token1?.symbol
    const isQuoteTokenStable = state.configs.configs.stablecoins.includes(state.currentPool.quoteToken)

    const routes = state.configs.routes
    const defaultStableCoin = state.configs.configs.stablecoins?.[0]
    const isHavePool = Object.keys(routes).filter(poolRoute => (poolRoute.includes(defaultStableCoin) && poolRoute.includes(state.currentPool.quoteToken)))?.[0]
    const isQuoteStableCoin = state.configs.configs.stablecoins?.some(stable => stable === state.currentPool.quoteToken)
    console.log('=====onReady running 1 ====')

    const currencyCodes = (isHavePool && !isQuoteStableCoin) ? [wrappedToNativeSymbol(quoteTokenSymbol), (isQuoteTokenStable ? 'ETH' : 'USD')] : null
    console.log('=====onReady running====')
    const config = {
      ...configDefault,
      currency_codes: currencyCodes
    }

    setTimeout(() => callback(config), 0)
  },

  resolveSymbol: async function (
    symbolInfo: any,
    onSymbolResolvedCallback: any,
    _onResolveErrorCallback: any,
    extension: any
  ) {
    const state = store.getState()
    // const { token0, token1 } = state.currentPool.pair
    // const quoteTokenSymbol = token0?.address === state.currentPool.quoteToken ? token0.symbol : token1?.symbol
    const isQuoteStableCoin = state.configs.configs.stablecoins?.some(stable => stable === state.currentPool.quoteToken)
    console.log('======resolveSymbol running====')
    const [, , , name, , priceScale] = symbolInfo.split('_')
    const symbolStub = {
      name: name,
      full_name: name,
      description: '',
      type: 'crypto',
      ticker: symbolInfo,
      session: '24x7',
      exchange: '',
      minmov: 1,
      pricescale: Math.pow(10, priceScale),
      visible_plots_set: 'ohlcv',
      has_intraday: true,
      supported_resolution: supportedResolutions,
      volume_precision: 8,
      data_status: 'streaming',
      currency_code: wrappedToNativeSymbol(isQuoteStableCoin ? 'USD' : extension.currencyCode) || 'USD'
    }
    onSymbolResolvedCallback(symbolStub)
  },

  getBars: async function (
    symbolInfo: any,
    resolution: any,
    periodParams: any,
    onHistoryCallback: any,
    onErrorCallback: any
  ) {
    console.log('=====getBars running======', { periodParams, symbolInfo })
    localStorage.setItem('chart_resolution', resolution)

    const state = store.getState()
    const ticker = symbolInfo.ticker
    // 0x539bdE0d7Dbd336b79148AA742883198BBF60342-0x59D72DDB29Da32847A4665d08ffc8464A7185FAE-1-0x82aF49447D8a07e3bd95BD0d56f35241523fBab1-0x82aF49447D8a07e3bd95BD0d56f35241523fBab1-MAGIC/ETH-42161-7
    const [baseAddress, cAddress, quoteAddress, , chainId] = ticker.split('_')

    const tokens = state.tokens.tokens[chainId]
    const { route, quoteAddressSelect, isPriceByIndexR } = handleChartRouteOption(symbolInfo?.currency_id, baseAddress, cAddress, quoteAddress)
    const limit = calcLimitCandle(periodParams.from, periodParams.to, resolution)
    store.dispatch(setPriceByIndexR({ status: isPriceByIndexR}))
    if (periodParams.firstDataRequest) {
      store.dispatch(setChartIntervalIsUpdated({ status: false }))
    }

    historyProvider
      .getBars({
        route: route.join(','),
        chainId,
        resolution,
        to: periodParams.to,
        limit: limit,
        inputToken: tokens[baseAddress],
        outputToken: tokens[quoteAddressSelect]
      })
      .then((bars: any) => {
        if (bars.length > 0) {
          if (periodParams.firstDataRequest) {
            store.dispatch(setCandleChartIsLoadingReduce({ status: false }))
            store.dispatch(setChartIntervalIsUpdated({ status: true }))
            detectChartIsOutdate(bars, resolution)
          }
          bars = removeChartAnomaly(bars)
          onHistoryCallback(bars, { noData: false })
        } else {
          onHistoryCallback(bars, { noData: true })
        }
      })
      .catch((err: any) => {
        onErrorCallback(err)
        store.dispatch(setChartIsOutDate({ status: true }))
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
      // 0x539bdE0d7Dbd336b79148AA742883198BBF60342-0x59D72DDB29Da32847A4665d08ffc8464A7185FAE-1-0x82aF49447D8a07e3bd95BD0d56f35241523fBab1-0x82aF49447D8a07e3bd95BD0d56f35241523fBab1-MAGIC/ETH-42161-7
      const [baseAddress, cAddress, quoteAddress, , chainId] = ticker.split('_')
      const tokens = state.tokens.tokens[chainId]
      const { route, quoteAddressSelect } = handleChartRouteOption(symbolInfo?.currency_id, baseAddress, cAddress, quoteAddress)
      historyProvider
        .getBars({
          route: route.join(','),
          resolution,
          limit: 2,
          chainId,
          to: LASTEST_BLOCK_NUMBER,
          inputToken: tokens[baseAddress],
          outputToken: tokens[quoteAddressSelect]
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
            detectChartIsOutdate(data, resolution)
            onRealtimeCallback(candle)
          }
        })
        .catch((e) => {
          console.error(e)
          store.dispatch(setChartIsOutDate({ status: true }))
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
    const walletTxs = state.wallet.mapAccounts[state.wallet.account].formartedSwapLogs
    const currentPool = state.currentPool
    const configs = state.configs
    const tokens = state.tokens.tokens[configs.chainId]

    const result = walletTxs
    ?.filter((tx:any) => currentPool.pools[tx.poolIn] || currentPool.pools[tx.poolOut])
    .map((t: any) => {
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
    const walletTxs = state.wallet.mapAccounts[state.wallet.account].formartedSwapLogs
    const currentPool = state.currentPool
    const configs = state.configs
    const tokens = state.tokens.tokens[configs.chainId]

    const result = walletTxs
    ?.filter((tx:any) => currentPool.pools[tx.poolIn] || currentPool.pools[tx.poolOut])
    .map((t: any) => {
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
  const time = moment(swapTx.timeStamp * 1000).format('YYYY-MM-DD, HH:mm')

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
  let label = getMarkLabel(swapTx.tokenOut)
  let labelContent = getMarkLabelContent(swapTx.tokenIn,swapTx.tokenOut)
  const [token1,token2,amount2] = labelContent.isClose ? 
  [swapTx.tokenIn, swapTx.tokenOut, swapTx.amountOut] :
   [swapTx.tokenOut, swapTx.tokenIn, swapTx.amountIn];
  result.color = getMarkColor(swapTx.tokenOut)
  if (timescaleMark) {
    result.tooltip = [
      time,
      `
      ${labelContent.text} ${getMarkPosition(token1, tokens) ?? tokens[token1]?.symbol ?? 'unknown'} \n
      ${labelContent.arrow}
      ${formatWeiToDisplayNumber(amount2, 4, tokens[token2]?.decimals || 18)}\n
      ${getMarkPosition(token2, tokens) ?? tokens[token2]?.symbol ?? 'unknown'} \n`
    ]
  } else {
    label = label.slice(0, 1)
    result.labelFontColor = '#ffffff'
    result.text = `
      ${labelContent.text} ${getMarkPosition(token1, tokens) ?? tokens[token1]?.symbol ?? 'unknown'} \n
      ${labelContent.arrow}
      ${formatWeiToDisplayNumber(amount2, 4, tokens[token2]?.decimals || 18)}\n
      ${getMarkPosition(token2, tokens) ?? tokens[token2]?.symbol ?? 'unknown'} \n`
  }
  result.label = label
  return result
}


const getMarkLabel = (address: string)=> {
  if (address === NATIVE_ADDRESS || !isErc1155Address(address)) {
    return 'C'
  }
  const id = address.split('-')[1]
  if (Number(id) === POOL_IDS.C) {
    return 'P'
  } else if (Number(id) === POOL_IDS.B) {
    return 'S'
  } else if (Number(id) === POOL_IDS.A) {
    return 'L'
  } else {
    return '-'
  }
}
const getMarkLabelContent = (addressIn: string, addressOut:string)  => {
  const isClose = addressOut === NATIVE_ADDRESS || !isErc1155Address(addressOut)  
  const addressInid = addressIn.split('-')[1]
  const addressOutid = addressOut.split('-')[1]
  if (Number(addressInid) === POOL_IDS.C || Number(addressOutid) === POOL_IDS.C) {
    if(isClose) return {text: 'Remove',arrow: "⇒", isClose}
    else return {text: "Add",arrow: "⇐", isClose}
  } else {
    if(isClose) return {text: "Close", arrow: "⇒", isClose}
    else return {text: "Open",arrow: "⇐", isClose}
  }
}

const getMarkPosition = (address: string, tokens: { [key: string]: TokenType; }) => {
  if (address === NATIVE_ADDRESS || !isErc1155Address(address)) {
    return tokens[address]?.symbol ?? 'ETH'
  }
  const id = address.split('-')[1]
  if (Number(id) === POOL_IDS.C) {
    return 'Liquidity'
  } else if (Number(id) === POOL_IDS.B) {
    return 'Short'
  } else if (Number(id) === POOL_IDS.A) {
    return 'Long'
  } else {
    return '-'
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

const detectChartIsOutdate = (candles: CandleType[], resolution: any) => {
  if (candles.length < 2) {
    return
  }
  const range = candles.length - 1
  const first = candles[0]
  const last = candles[range]

  const duration = last.time - first.time
  const avg = duration / range

  // thrice the average tx time
  const resTime = TIME_IN_RESOLUTION[resolution] ?? 60
  const nextTime = last.time + resTime + 4 * avg
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
