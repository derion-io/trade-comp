import LineChartLoaderSVG from './LineChartLoaderSVG'
import React from 'react'
import CandleChartLoaderSVG from './CandleChartLoaderSVG'
import './style.scss'

export const LineChartLoader: React.FC<React.PropsWithChildren<any>> =
  React.memo(() => {
    return (
      <div className='loading-indicator'>
        <div style={{opacity: 0}}>        <LineChartLoaderSVG /> </div>
        <span className='loading-text'>Loading chart data...</span>
      </div>
    )
  })

export const CandleChartLoader: React.FC<React.PropsWithChildren<any>> =
  React.memo(() => {
    return (
      <div className='loading-indicator'>
        <CandleChartLoaderSVG />
        <span className='loading-text'>Loading chart data...</span>
      </div>
    )
  })
