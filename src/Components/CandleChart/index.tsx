import React, { useEffect, useRef, useState } from 'react'
import './style.scss'
import {
  ChartingLibraryWidgetOptions,
  IChartingLibraryWidget,
  ResolutionString, TimeFrameType,
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
  containerId: ChartingLibraryWidgetOptions['container_id']
  logo?: any
}

let cToken: any, baseToken: any, quoteToken: any
// const cToken = '0x905dfCD5649217c42684f23958568e533C711Aa3'
// const baseToken = '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1'
// const quoteToken = '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8'

// TODO: need to fix chart decimal

const Component = ({
  interval,
  containerId,
  libraryPath,
  clientId,
  userId,
  fullscreen,
  autosize,
  studiesOverrides
}: ChartContainerProps) => {
  const [tradingviewWidget, setTradingviewWidget] = useState<any>(null)
  const { tokens } = useListTokens()
  const {
    id,
    chartIsOutDate,
    candleChartIsLoading,
    chartResolutionIsUpdated,
    setCandleChartIsLoading,
    chartTimeFocus,
    setChartTimeFocus
  } = useCurrentPoolGroup()
  const { chainId } = useConfigs()
  const { formartedSwapLogs: swapTxs } = useSwapHistory()
  const timeRangeRef = useRef<any>(null)
  const [currentChart, setCurrentChart] = useState<string>('')
  const { poolGroups } = useResource()
  baseToken = poolGroups[id]?.baseToken
  quoteToken = poolGroups[id]?.quoteToken
  cToken = id

  useEffect(() => {
    if (tokens[baseToken] && tokens[quoteToken] && cToken && currentChart !== baseToken + cToken + quoteToken) {
      setTimeout(initChart)
      setCurrentChart(baseToken + cToken + quoteToken)
    }
  }, [tokens[baseToken], tokens[quoteToken], cToken])

  useEffect(() => {
    if (tradingviewWidget) {
      try {
        tradingviewWidget.activeChart().clearMarks()
        tradingviewWidget.activeChart().refreshMarks()
      } catch (e) {
        console.error(e)
      }
    }
  }, [swapTxs])

  useEffect(() => {
    if (tradingviewWidget && chartTimeFocus) {
      try {
        const resolution = tradingviewWidget.activeChart().resolution()
        tradingviewWidget.activeChart().setVisibleRange(detectRange(resolution, chartTimeFocus, chartTimeFocus))
      } catch (e) {
        console.error(e)
      }
    }
  }, [chartTimeFocus])

  useEffect(() => {
    if (tradingviewWidget && chartResolutionIsUpdated) {
      try {
        const resolution = tradingviewWidget.activeChart().resolution()
        const data = timeRangeRef.current.value
        const [from, to] = data.split(',').map(Number)
        tradingviewWidget.activeChart().setVisibleRange(detectRange(resolution, from, to))
      } catch (e) {
        console.error(e)
      }
    }
  }, [chartResolutionIsUpdated])

  const initChart = async () => {
    setChartTimeFocus(0)
    setCandleChartIsLoading(true)
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const widgetOptions: any = {
      symbol: [baseToken, cToken, quoteToken, tokens[baseToken]?.symbol + '/' + tokens[quoteToken]?.symbol, chainId].join('-'),
      datafeed: Datafeed,
      interval: (interval as ChartingLibraryWidgetOptions['interval']),
      container_id: containerId as ChartingLibraryWidgetOptions['container_id'],
      library_path: libraryPath as string,
      locale: 'en',
      data_status: 'streaming',
      enabled_features: [
        'hide_left_toolbar_by_default',
        // 'disable_resolution_rebuild',
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
      loading_screen: {
        backgroundColor: 'transparent'
      }
    }

    const tvWidget: IChartingLibraryWidget = new widget(widgetOptions)
    tvWidget.onChartReady(() => {
      setTradingviewWidget(tvWidget)
      tvWidget.activeChart().onVisibleRangeChanged().subscribe(null, ({ from, to }) => {
        if (timeRangeRef) {
          timeRangeRef.current.value = from + ',' + to
        }
      })
      tvWidget.activeChart().onIntervalChanged().subscribe(null, (resolution, timeframeObj) => {
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
    const timePerCandle = TIME_IN_RESOLUTION[resolution]
    const middleTime = (from + to) / 2
    return {
      from: middleTime - timePerCandle * 50,
      to: middleTime + timePerCandle * 50
    }
  }

  // eslint-disable-next-line no-constant-condition

  return (
    <Card className='candle-chart-wrap'>
      { candleChartIsLoading &&
        <div className='loading'>
          <CandleChartLoader />
        </div>
      }
      <input type='text' ref={timeRangeRef} className='hidden' />
      <div className={`candle-chart-box ${candleChartIsLoading && 'transparent'}`}>
        <div
          id={containerId}
          className='TVChartContainer'
          style={{
            width: '100%',
            height: '100%'
          }}
        />
      </div>
      {
        chartIsOutDate && <div className='outdate-message'>
          OUTDATED
        </div>
      }
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
