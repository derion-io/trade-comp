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
import { useWindowSize } from '../../hooks/useWindowSize'
import { useCurrentPool } from '../../state/currentPool/hooks/useCurrentPool'

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

export const Chart = ({
  interval,
  containerId,
  libraryPath,
  clientId,
  userId,
  fullscreen,
  autosize,
  studiesOverrides
}: ChartContainerProps) => {
  const { width } = useWindowSize()
  const [tradingviewWidget, setTradingviewWidget] = useState<any>(null)
  const { tokens } = useListTokens()
  const { cToken, baseToken, quoteToken } = useCurrentPool()

  useEffect(() => {
    if(cToken && baseToken && quoteToken) {
      setTimeout(initChart)
    }
  }, [cToken, baseToken, quoteToken])

  const initChart = async () => {
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
      overrides: {
        'paneProperties.backgroundType': 'solid',
        'paneProperties.background': '#1E2026',
        'paneProperties.backgroundGradientEndColor': '#1E2026',
        'paneProperties.backgroundGradientStartColor': '#1E2026',
        'paneProperties.vertGridProperties.color': 'rgba(128,128,128,0.2)',
        'paneProperties.horzGridProperties.color': 'rgba(128,128,128,0.2)',
        'scalesProperties.textColor': '#ffffff'
      },
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
    })
  }

  return (
    <div className='chart-wrap'>
      <div className='chart-box'>
        <div
          id={containerId}
          className='TVChartContainer'
          style={{
            width: '100%',
            height: '100%'
          }}
        />
      </div>
    </div>
  )
}

Chart.defaultProps = {
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
