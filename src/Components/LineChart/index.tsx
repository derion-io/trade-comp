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
import { DATE_FORMATS, I_1D, I_1W, INTERVALS_TAB, LineChartIntervalType } from '../../utils/lineChartConstant'
import { Tabs } from '../ui/Tabs'
import { COLORS } from '../../utils/constant'
import isEqual from 'react-fast-compare'
import { useConfigs } from '../../state/config/useConfigs'

const cToken = '0x905dfCD5649217c42684f23958568e533C711Aa3'

const Component = ({ changedIn24h }: { changedIn24h: number }) => {
  const { getLineChartData } = useExchangeData()
  const { baseToken, quoteToken, basePrice } = useCurrentPool()
  const { tokens } = useListTokens()
  const [hoverValue, setHoverValue] = useState<number>()
  const [chartData, setChartData] = useState<{ [key: string]: any[] }>({})
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [hoverDate, setHoverDate] = useState<string>()
  const [interval, setInterval] = useState<LineChartIntervalType>(I_1W)
  const { chainId } = useConfigs()
  useEffect(() => {
    if (!chartData[chainId + interval + cToken] && cToken) {
      setIsLoading(true)
      getLineChartData({ chainId, pair: cToken.toLowerCase(), baseToken, interval })
        .then((data) => {
          setChartData({
            ...chartData,
            [chainId + interval + cToken]: data
          })
          setIsLoading(false)
        })
    }
  }, [cToken, chainId, interval])

  const finalData = useMemo(() => {
    const data = [
      ...chartData[chainId + interval + cToken],
      {
        time: new Date().getTime(),
        value: formatFloat(basePrice)
      }
    ]
    return data
  }, [chartData, interval, chainId, basePrice])

  const color = useMemo(() => {
    return changedIn24h > 0
      ? COLORS.BUY
      : COLORS.SELL
  }, [changedIn24h])

  return <div className='line-chart-wrap'>
    <div className='line-chart__head'>
      <div className='line-chart__head--left'>
        <div>
          <Text fontSize={24} fontWeight={700} className='mr-05'>
            {hoverValue || formatFloat(basePrice)}
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
      {(isLoading || !chartData[chainId + interval + cToken]) &&
        <div className='line-chart__loading'>
          <LineChartLoader />
        </div>
      }
      {chartData[chainId + interval + cToken] && chartData[chainId + interval + cToken].length > 0 &&
        <ResponsiveContainer>
          <AreaChart
            data={finalData}
            margin={{
              top: 5,
              right: 0,
              left: 0,
              bottom: 5
            }}
            onMouseLeave={() => {
              if (setHoverDate) setHoverDate(undefined)
              if (setHoverValue) setHoverValue(undefined)
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
              tickFormatter={(time) => moment(time).format(interval === I_1D ? 'HH:mm' : 'DD/MM')}
              minTickGap={8}
            />
            <YAxis
              dataKey='value'
              axisLine={false}
              tickLine={false}
              domain={['auto', 'auto']}
              minTickGap={8}
            />
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
}

const HoverUpdater = ({ payload, setHoverValue, setHoverDate }: any) => {
  useEffect(() => {
    setHoverValue(payload.value)
    setHoverDate(payload.time)
  }, [payload.value, payload.time, setHoverValue, setHoverDate])

  return null
}

export const LineChart = React.memo(Component, (prevProps, nextProps) =>
  isEqual(prevProps, nextProps)
)
