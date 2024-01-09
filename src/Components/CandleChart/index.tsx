import React, { useEffect, useRef, useState } from 'react'
import './style.scss'
// eslint-disable-next-line no-unused-vars
import {
  ChartingLibraryWidgetOptions,
  IChartingLibraryWidget,
  ResolutionString,
  TimeFrameType,
  VisibilityType,
  widget
} from '../../lib/charting_library'
import { Datafeed, TIME_IN_RESOLUTION } from '../../lib/datafeed'
import { useListTokens } from '../../state/token/hook'
import { useCurrentPoolGroup } from '../../state/currentPool/hooks/useCurrentPoolGroup'
import { useResource } from '../../state/resources/hooks/useResource'
import { Card } from '../ui/Card'
import { useSwapHistory } from '../../state/wallet/hooks/useSwapHistory'
import { CandleChartLoader } from '../ChartLoaders'
import isEqual from 'react-fast-compare'
import { useConfigs } from '../../state/config/useConfigs'
import { decimalsBySignificantDigits, unwrap, zerofy } from '../../utils/helpers'
import { store } from '../../state'
import { setPriceByIndexR } from '../../state/currentPool/reducer'

export interface ChartContainerProps {
  interval: ChartingLibraryWidgetOptions['interval']
  datafeedUrl: string
  libraryPath: ChartingLibraryWidgetOptions['library_path']
  chartsStorageUrl: ChartingLibraryWidgetOptions['charts_storage_url']
  chartsStorageApiVersion: ChartingLibraryWidgetOptions['charts_storage_api_version']
  clientId: ChartingLibraryWidgetOptions['client_id']
  userId: ChartingLibraryWidgetOptions['user_id']
  fullscreen: ChartingLibraryWidgetOptions['fullscreen']
  autosize: ChartingLibraryWidgetOptions['autosize']
  studiesOverrides: ChartingLibraryWidgetOptions['studies_overrides']
  logo?: any
}

// TODO: need to fix chart decimal

const Component = ({
  interval,
  libraryPath,
  clientId,
  userId,
  fullscreen,
  autosize,
  studiesOverrides
}: ChartContainerProps) => {
  const chartContainerRef = useRef<HTMLDivElement | null>(null)
  const [tradingviewWidget, setTradingviewWidget] = useState<any>()
  const { tokens } = useListTokens()
  const {
    id,
    chartIsOutDate,
    candleChartIsLoading,
    chartResolutionIsUpdated,
    setCandleChartIsLoading,
    chartTimeFocus,
    basePrice,
    setChartTimeFocus
  } = useCurrentPoolGroup()
  const { chainId } = useConfigs()
  const { formartedSwapLogs: swapTxs } = useSwapHistory()
  const timeRangeRef = useRef<any>()
  const [currentChart, setCurrentChart] = useState<string>('')
  const { poolGroups } = useResource()
  const [chartResolution, setChartResolution] = useState<string>('1')
  const baseToken = poolGroups ? poolGroups[id]?.baseToken : ''
  const quoteToken = poolGroups ? poolGroups[id]?.quoteToken : ''
  const cToken = id

  useEffect(() => {
    if (
      tokens[baseToken] &&
      tokens[quoteToken] &&
      cToken &&
      currentChart !== baseToken + cToken + quoteToken
    ) {
      setTimeout(initChart)
      setCurrentChart(baseToken + cToken + quoteToken)
    }
  }, [baseToken, quoteToken, cToken])

  useEffect(() => {
    if (tradingviewWidget) {
      try {
        tradingviewWidget.onChartReady(() => {
          tradingviewWidget.activeChart().clearMarks()
        })
      } catch (e) {
        console.error(e)
      }
    }
  }, [JSON.stringify(swapTxs)])

  useEffect(() => {
    if (tradingviewWidget && chartTimeFocus) {
      try {
        tradingviewWidget.onChartReady(() => {
          const resolution = tradingviewWidget.activeChart().resolution()
          setChartResolution(resolution)
          tradingviewWidget
            .activeChart()
            .setVisibleRange(
              detectRange(resolution, chartTimeFocus, chartTimeFocus)
            )
        })
      } catch (e) {
        console.error(e)
      }
    }
  }, [chartTimeFocus])

  useEffect(() => {
    if (tradingviewWidget && chartResolutionIsUpdated) {
      try {
        tradingviewWidget.onChartReady(() => {
          const resolution = tradingviewWidget.activeChart().resolution()
          setChartResolution(resolution)
          const data = timeRangeRef.current.value
          const [from, to] = data.split(',').map(Number)
          tradingviewWidget
            .activeChart()
            .setVisibleRange(detectRange(resolution, from, to))
        })
      } catch (e) {
        console.error(e)
      }
    }
  }, [chartResolutionIsUpdated])

  const initChart = async () => {
    setChartTimeFocus(0)
    setCandleChartIsLoading(true)
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

    const zerofyFormatter = {
      format: (value: number) => {
        return zerofy(value, {
          maxExtraDigits: 2,
          minimumSignificantDigits: 3,
          maximumSignificantDigits: 3
        })
      }
    }

    const widgetOptions: any = {
      symbol: [
        baseToken,
        cToken,
        quoteToken,
        unwrap(tokens[baseToken]?.symbol) + '/' + unwrap(tokens[quoteToken]?.symbol),
        chainId,
        decimalsBySignificantDigits(basePrice)
      ].join('-'),
      datafeed: Datafeed,
      interval: interval as ChartingLibraryWidgetOptions['interval'],
      library_path: libraryPath as string,
      locale: 'en',
      data_status: 'streaming',
      enabled_features: [
        'hide_left_toolbar_by_default',
        // 'disable_resolution_rebuild',
        'iframe_loading_compatibility_mode',
        'pricescale_currency'
      ],
      disabled_features: [
        'popup_hints',
        'header_chart_type',
        'header_compare',
        'timeframes_toolbar',
        'header_undo_redo',
        'header_symbol_search'
      ],
      theme: 'Dark',
      favorites: {
        intervals: ['1', '5', '15', '60', '240', '1D', '1W', '1M']
      },
      client_id: clientId,
      user_id: userId,
      fullscreen: fullscreen,
      autosize: autosize,
      studies_overrides: studiesOverrides,
      timezone: timezone === 'Asia/Saigon' ? 'Asia/Ho_Chi_Minh' : timezone,
      container: chartContainerRef.current,
      custom_formatters: {
        priceFormatterFactory: () => { return zerofyFormatter },
        studyFormatterFactory: () => { return zerofyFormatter }
      },
      loading_screen: {
        backgroundColor: 'transparent'
      }
    }
    // eslint-disable-next-line new-cap
    const tvWidget: IChartingLibraryWidget = new widget(widgetOptions)
    setTradingviewWidget(tvWidget)
    tvWidget.onChartReady(() => {
      tvWidget.currencyAndUnitVisibility().setValue(VisibilityType.AlwaysOn)
      setTradingviewWidget(tvWidget)
      tvWidget
        .activeChart()
        .onVisibleRangeChanged()
        .subscribe(null, ({ from, to }) => {
          if (timeRangeRef) {
            timeRangeRef.current.value = from + ',' + to
          }
        })
      tvWidget.activeChart().onSymbolChanged().subscribe(null,
        // @ts-ignore
        (symbolEx) => {
          store.dispatch(setPriceByIndexR({ status: symbolEx.currency_code !== 'USD' }))
        }
      )
      tvWidget
        .activeChart()
        .onIntervalChanged()
        .subscribe(null, (resolution, timeframeObj) => {
          const data = timeRangeRef.current.value
          const [from, to] = data.split(',').map(Number)
          if (resolution && from && to) {
            timeframeObj.timeframe = {
              type: TimeFrameType.TimeRange,
              ...detectRange(resolution, from, to)
            }
          }
        })
      tvWidget.applyOverrides({
        'paneProperties.backgroundType': 'solid',
        'paneProperties.background': '#1E2026',
        'paneProperties.backgroundGradientEndColor': '#1E2026',
        'paneProperties.backgroundGradientStartColor': '#1E2026',
        'paneProperties.vertGridProperties.color': 'rgba(128,128,128,0.2)',
        'paneProperties.horzGridProperties.color': 'rgba(128,128,128,0.2)'
      })
    })
  }

  const detectRange = (resolution: string, from: number, to: number) => {
    const size = TIME_IN_RESOLUTION[resolution]
    from = Math.min(from, to - size * 40)
    return { from, to }
  }

  return (
    <Card className='candle-chart-wrap' >
      {candleChartIsLoading && (
        <div className='loading'>
          <CandleChartLoader />
        </div>
      )}
      <input type='text' ref={timeRangeRef} className='hidden' />
      <div
        className={`candle-chart-box ${candleChartIsLoading && 'transparent'}`}
      >
        <div
          ref={chartContainerRef}
          className='TVChartContainer'
          style={{
            width: '100%',
            height: '100%'
          }}
        />
      </div>
      {chartIsOutDate && <div className='outdate-message'>OUTDATED</div>}
    </Card>
  )
}

Component.defaultProps = {
  interval: (localStorage.getItem('chart_resolution') ||
    '240') as ResolutionString,
  containerId: 'tv_chart_container',
  datafeedUrl: 'https://demo_feed.tradingview.com',
  libraryPath: '/charting_library/',
  chartsStorageUrl: 'https://saveload.tradingview.com',
  chartsStorageApiVersion: '1.2',
  clientId: 'tradingview.com',
  userId: 'public_user_id',
  fullscreen: false,
  autosize: true,
  studiesOverrides: {}
}

export const CandleChart = React.memo(Component, (prevProps, nextProps) =>
  isEqual(prevProps, nextProps)
)
