import historyProvider, { CandleType } from 'derivable-tools/dist/historyProvider'
import { LASTEST_BLOCK_NUMBER, NATIVE_ADDRESS, POOL_IDS } from '../../utils/constant'
import { store } from '../../state'
import {
  setCandleChartIsLoadingReduce, setChartIntervalIsUpdated,
  setChartIsOutDate
} from '../../state/currentPool/reducer'
import { getErc20AmountChange } from '../../utils/swapHistoryHelper'
import { SwapTxType } from '../../state/wallet/type'
import moment from 'moment'
import { BigNumber } from 'ethers'
import { formatWeiToDisplayNumber } from '../../utils/formatBalance'
import { currentPoolState } from '../../state/currentPool/type'
import { formatFloat } from '../../utils/helpers'
import { TokenType } from '../../state/token/type'
import allConfigs from '../../state/config/configs'

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

    const state = store.getState()
    const ticker = symbolInfo.ticker
    const [baseAddress, cAddress, quoteAddress,, chainId] = ticker.split('-')
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
            detectChartIsOutdate(bars[bars.length - 1], interval)
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
  subscribeBars: function (
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
      const [baseAddress, cAddress, quoteAddress,, chainId] = ticker.split('-')
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
  },

  getTimescaleMarks: async function (
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
        allConfigs[configs.chainId],
        true
      )
    })
    onDataCallback(result)
  },
  getMarks: async function (
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
        allConfigs[configs.chainId]
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
  const { baseId, quoteId, cToken, quoteToken, baseToken } = currentPool
  const cChange = getErc20AmountChange(swapTx.oldBalances, swapTx.newBalances, POOL_IDS.cToken)
  const nativeChange = getErc20AmountChange(swapTx.oldBalances, swapTx.newBalances, POOL_IDS.native)
  const cpChange = getErc20AmountChange(swapTx.newBalances, swapTx.oldBalances, POOL_IDS.cp)
  const baseChange = getErc20AmountChange(swapTx.oldBalances, swapTx.newBalances, baseId)
  const quoteChange = getErc20AmountChange(swapTx.oldBalances, swapTx.newBalances, quoteId)
  const time = moment(swapTx.timeStamp * 1000).format('DD/MM/YYYY, hh:mm a')

  const amountChange = `<span>
    ${getAmountChange({ tokens, amountChange: cChange, address: cToken })}
    ${getAmountChange({ tokens, amountChange: nativeChange, address: NATIVE_ADDRESS })}
    ${getAmountChange({ tokens, amountChange: baseChange, address: baseToken })}
    ${getAmountChange({ tokens, amountChange: quoteChange, address: quoteToken })}
  </span>`

  const arrow = (cChange.gt(0) || nativeChange.gt(0) || quoteChange.gt(0) || baseChange.gt(0))
    ? `<span style='color: ${COLORS.BUY}'>-></span>`
    : (cChange.isNegative() || nativeChange.isNegative() || quoteChange.isNegative() || baseChange.isNegative())
      ? `<span style='color: ${COLORS.SELL}'><-</span>` : ''

  const cpChangeText = !cpChange.isZero()
    ? `<span>
      <span style='color: ${COLORS.BLUE}'>CP </span>
      ${formatWeiToDisplayNumber(cpChange, 4, tokens[cToken]?.decimal || 18)}
  </span>` : ''

  const leverageChange = swapTx.oldLeverage !== swapTx.newLeverage
    ? `<span>
      ${swapTx.oldLeverage ? getLeverageText(swapTx.oldLeverage) : leverageText0}
      ${swapTx.newLeverage || swapTx.oldLeverage ? ' -> ' : ''}
      ${swapTx.newLeverage ? getLeverageText(swapTx.newLeverage) : leverageText0}
    </span>`
    : ''

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

  result.color = 'pink'
  if (!cpChange.isZero()) {
    result.color = 'blue'
  } else if (swapTx.oldLeverage && swapTx.newLeverage && swapTx.newLeverage !== swapTx.oldLeverage) {
    result.color = swapTx.newLeverage > swapTx.oldLeverage ? 'green' : 'red'
  }

  if (timescaleMark) {
    result.tooltip = [
      'Execute at ' + time,
      `<div>
        ${amountChange}
        ${arrow}
        ${cpChangeText}
        ${leverageChange}
      </div>`,
      `<div>
        ${explorerLink}
      </div>`
    ]
  } else {
    label = label.slice(0, 1)
    result.labelFontColor = '#ffffff'
    result.text = `<div>
      <p>Execute at ${time}</p>
      <div>
        ${amountChange}
        ${arrow}
        ${cpChangeText}
        ${leverageChange}
      </div>
      <div>
        ${explorerLink}
      </div>
    </div>`
  }
  result.label = label
  return result
}

const getLeverageText = (leverage: number) => {
  return `<span style='color: ${leverage > 0 ? COLORS.BUY : COLORS.SELL}'>${leverage > 0 ? 'Long ' : 'Short '} ${formatFloat(leverage, 1)}</span>`
}

const leverageText0 = `<span style='color: ${COLORS.PINK}'>0</span>`

const getAmountChange = ({ amountChange, address, tokens }: {
  tokens: { [key: string]: TokenType },
  amountChange: BigNumber,
  address: string
}) => {
  if (amountChange.isZero()) return ''
  return `<span>
    <span style='color: ${COLORS.PINK}'>${tokens[address]?.symbol}</span>
  <span>${formatWeiToDisplayNumber(amountChange.abs(), 4, tokens[address]?.decimal || 18)}</span>
  </span>`
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
