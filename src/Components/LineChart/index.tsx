import React, { useEffect, useState } from 'react'
import { useExchangeData } from '../../hooks/useExchangeData'
import { LineChartLoader } from '../ChartLoaders'
import { ResponsiveContainer, XAxis, YAxis, Tooltip, AreaChart, Area } from 'recharts'
import './style.scss'
import { useCurrentPool } from '../../state/currentPool/hooks/useCurrentPool'
import moment from 'moment'
const data = [
  {
    name: 'Page A',
    uv: 4000,
    pv: 2400,
    amt: 2400
  },
  {
    name: 'Page B',
    uv: 3000,
    pv: 1398,
    amt: 2210
  },
  {
    name: 'Page C',
    uv: 2000,
    pv: 9800,
    amt: 2290
  },
  {
    name: 'Page D',
    uv: 2780,
    pv: 3908,
    amt: 2000
  },
  {
    name: 'Page E',
    uv: 1890,
    pv: 4800,
    amt: 2181
  },
  {
    name: 'Page F',
    uv: 2390,
    pv: 3800,
    amt: 2500
  },
  {
    name: 'Page G',
    uv: 3490,
    pv: 4300,
    amt: 2100
  }
]
export const LineChart = () => {
  const [chartData, setChartData] = useState<any>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [hoverValue, setHoverValue] = useState<string>('')
  const [hoverDate, setHoverDate] = useState<string>('')
  const { getLineChartData } = useExchangeData()
  const { cToken, baseToken } = useCurrentPool()

  useEffect(() => {
    setIsLoading(true)
    getLineChartData({ pair: cToken, baseToken })
      .then((data) => {
        setChartData(data)
        setIsLoading(false)
      })
  }, [cToken])

  return <div className='line-chart-wrap'>
    {isLoading &&
    <div className='loading'>
      <LineChartLoader />
    </div>
    }
    <div className={`line-chart-box ${isLoading && 'transparent'}`}>
      <ResponsiveContainer>
        <AreaChart
          data={chartData}
          margin={{
            top: 5,
            right: 0,
            left: 0,
            bottom: 5
          }}
          onMouseLeave={(a, b) => {
            console.log(a, b)
            // if (setHoverDate) setHoverDate(undefined)
            // if (setHoverValue) setHoverValue(undefined)
          }}
        >
          <defs>
            <linearGradient id='gradient' x1='0' y1='0' x2='0' y2='1'>
              <stop offset='5%' stopColor='#FF98E5' stopOpacity={0.34} />
              <stop offset='100%' stopColor='#01A7FA' stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey='time'
            axisLine={false}
            tickLine={false}
            tickFormatter={(time) => moment(time * 1000).format('hh:mm a')}
            minTickGap={8}
          />
          <YAxis dataKey='value' axisLine={false} tickLine={false} domain={['auto', 'auto']} hide />
          <Tooltip
            cursor={{ stroke: '#FF7A68' }}
            contentStyle={{ display: 'none' }}
            // @ts-ignore
            formatter={(tooltipValue, name, props) => (
              <HoverUpdater
                payload={props.payload}
                setHoverValue={setHoverValue}
                setHoverDate={setHoverDate}
              />
            )}
          />
          <Area dataKey='value' type='linear' stroke='#4FBF67' fill='url(#gradient)' strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
}

const HoverUpdater = ({ payload, setHoverValue, setHoverDate }: any) => {
  useEffect(() => {
    setHoverValue(payload.value)
    console.log(payload)
  }, [payload.value, payload.time, setHoverValue, setHoverDate])

  return null
}
