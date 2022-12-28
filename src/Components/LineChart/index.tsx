import React, { useEffect, useMemo, useState } from 'react'
import { useExchangeData } from '../../hooks/useExchangeData'
import { LineChartLoader } from '../ChartLoaders'
import { ResponsiveContainer, XAxis, YAxis, Tooltip, AreaChart, Area } from 'recharts'
import './style.scss'
import { useCurrentPool } from '../../state/currentPool/hooks/useCurrentPool'
import moment from 'moment'
import { useListTokens } from '../../state/token/hook'
import { Text, TextBuy, TextGrey, TextSell } from '../ui/Text'
import { formatFloat } from '../../utils/helpers'
import { DATE_FORMATS, I_1W, INTERVALS_TAB, LineChartIntervalType } from '../../utils/lineChartConstant'
import { Tabs } from '../ui/Tabs'
import { COLORS } from '../../utils/constant'

export const LineChart = ({ changedIn24h }: { changedIn24h: number }) => {
  const { getLineChartData } = useExchangeData()
  const { cToken, baseToken, quoteToken, basePrice } = useCurrentPool()
  const { tokens } = useListTokens()
  const [hoverValue, setHoverValue] = useState<number>(formatFloat(basePrice))
  const [chartData, setChartData] = useState<{ [key: string]: any[] }>({})
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [hoverDate, setHoverDate] = useState<string>('')
  const [interval, setInterval] = useState<LineChartIntervalType>(I_1W)
  useEffect(() => {
    if (!chartData[interval]) {
      setIsLoading(true)
      getLineChartData({ pair: cToken, baseToken, interval })
        .then((data) => {
          setChartData({
            ...chartData,
            [interval]: data
          })
          setIsLoading(false)
        })
    }
  }, [cToken, interval])

  const [finalData, color] = useMemo(() => {
    const data = [
      ...chartData[interval],
      {
        time: new Date().getTime(),
        value: formatFloat(basePrice)
      }
    ]
    const color = data[data.length - 1].value > data[data.length - 2]
      ? COLORS.BUY
      : COLORS.SELL
    return [data, color]
  }, [chartData[interval], basePrice])

  return <div className='line-chart-wrap'>
    <div className={`${isLoading && 'transparent'}`}>
      <div className='line-chart__head'>
        <div className='line-chart__head--left'>
          <div>
            <Text fontSize={24} fontWeight={700} className='mr-05'>
              {hoverValue}
            </Text>
            <TextGrey className='mr-05' fontWeight={700}>
              {tokens[baseToken]?.symbol}/{tokens[quoteToken]?.symbol}
            </TextGrey>
            {
              changedIn24h >= 0
                ? <TextBuy>(+{changedIn24h}%)</TextBuy>
                : <TextSell>({changedIn24h}%)</TextSell>
            }
          </div>
          <div>
            <TextGrey>{moment(hoverDate || new Date().getTime()).format(DATE_FORMATS.FULL)}</TextGrey>
          </div>
        </div>
        <div className='line-chart__head--right'>
          <Tabs
            tab={interval}
            setTab={setInterval}
            tabs={INTERVALS_TAB}
          />
        </div>
      </div>
      <div className='line-chart-box'>
        {(isLoading || !chartData[interval]) &&
        <div className='line-chart__loading'>
          <LineChartLoader />
        </div>
        }
        {chartData[interval] && chartData[interval].length > 0 &&
        <ResponsiveContainer>
          <AreaChart
            data={finalData}
            margin={{
              top: 5,
              right: 0,
              left: 0,
              bottom: 5
            }}
          >
            <defs>
              <linearGradient id='gradient' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='5%' stopColor={color} stopOpacity={0.34} />
                <stop offset='100%' stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey='time'
              axisLine={false}
              tickLine={false}
              tickFormatter={(time) => moment(time).format('hh:mm a')}
              minTickGap={8}
            />
            <YAxis dataKey='value' axisLine={false} tickLine={false} domain={['auto', 'auto']} hide />
            <Tooltip
              cursor={{ stroke: '#a6a6a6' }}
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
            <Area dataKey='value' type='linear' stroke={color} fill='url(#gradient)' strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
        }
      </div>
    </div>
  </div>
}

const HoverUpdater = ({ payload, setHoverValue, setHoverDate }: any) => {
  useEffect(() => {
    setHoverValue(payload.value)
    setHoverDate(payload.time)
  }, [payload.value, payload.time, setHoverValue, setHoverDate])

  return null
}
