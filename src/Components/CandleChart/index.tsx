import React, { useEffect, useState } from 'react'
import './style.scss'
import {
  ChartingLibraryWidgetOptions,
  IChartingLibraryWidget,
  ResolutionString,
  widget
} from '../../lib/charting_library'
import { Datafeed } from '../../lib/datafeed'
import { useListTokens } from '../../state/token/hook'
import { useCurrentPool } from '../../state/currentPool/hooks/useCurrentPool'
import { Card } from '../ui/Card'
import { useSwapHistory } from '../../state/wallet/hooks/useSwapHistory'
import { CandleChartLoader } from '../ChartLoaders'

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

export const CandleChart = ({
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
  const { cToken, baseToken, quoteToken, chartIsOutDate, candleChartIsLoading, setCandleChartIsLoading } = useCurrentPool()
  const { formartedSwapLogs: swapTxs } = useSwapHistory()

  useEffect(() => {
    if (cToken && baseToken && quoteToken) {
      setTimeout(initChart)
    }
  }, [cToken, baseToken, quoteToken])

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

  const initChart = async () => {
    setCandleChartIsLoading(true)
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const widgetOptions: any = {
      symbol: [baseToken, cToken, quoteToken, tokens[baseToken]?.symbol + '/' + tokens[quoteToken]?.symbol].join('-'),
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
      // tvWidget.addCustomCSSFile('/darkTheme.css')
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

  // eslint-disable-next-line no-constant-condition

  return (
    <Card className='candle-chart-wrap'>
      { candleChartIsLoading &&
        <div className='loading'>
          <CandleChartLoader />
        </div>
      }
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

CandleChart.defaultProps = {
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
