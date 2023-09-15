import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useExchangeData } from '../../hooks/useExchangeData'
import { LineChartLoader } from '../ChartLoaders'
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area
} from 'recharts'
import './style.scss'
import { useCurrentPoolGroup } from '../../state/currentPool/hooks/useCurrentPoolGroup'
import moment from 'moment'
import { Text, TextGrey } from '../ui/Text'
// eslint-disable-next-line no-unused-vars
import {
  DATE_FORMATS,
  I_1D,
  INTERVALS_TAB,
  LineChartIntervalType
} from '../../utils/lineChartConstant'
import { Tabs } from '../ui/Tabs'
import { COLORS } from '../../utils/constant'
import isEqual from 'react-fast-compare'
import { useConfigs } from '../../state/config/useConfigs'
import { formatFloat, zerofy } from '../../utils/helpers'
import { ReloadIcon } from '../../Components/ui/Icon'
import { useWindowSize } from '../../hooks/useWindowSize'

const Component = ({ changedIn24h }: { changedIn24h: number }) => {
  const { getLineChartData } = useExchangeData()
  const { baseToken, id, basePrice } = useCurrentPoolGroup()
  const [hoverValue, setHoverValue] = useState<string>()
  const [chartData, setChartData] = useState<{ [key: string]: any[] }>({})
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [hoverDate, setHoverDate] = useState<number>()
  const [interval, setInterval] = useState<LineChartIntervalType>(I_1D)
  const { chainId } = useConfigs()
  const headRef = useRef<HTMLDivElement>(null)
  const cToken = id
  const { width } = useWindowSize()
  const isPhone = width && width < 768
  useEffect(() => {
    if (!chartData[chainId + interval + cToken] || cToken) {
      loadData()
    }
  }, [cToken, chainId, interval])

  useEffect(() => {
    if (basePrice) {
      setHoverValue(zerofy(formatFloat(basePrice)))
      setHoverDate(new Date().getTime())
    }
  }, [basePrice])

  const finalData = useMemo(() => {
    const data = [...chartData[chainId + interval + cToken]]
    return data
  }, [chartData, interval, chainId])

  const color = useMemo(() => {
    return changedIn24h > 0 ? COLORS.BUY : COLORS.SELL
  }, [changedIn24h])

  const loadData = () => {
    setIsLoading(true)
    getLineChartData({ pair: cToken.toLowerCase(), baseToken, interval }).then(
      (data) => {
        setChartData({
          ...chartData,
          [chainId + interval + cToken]: data
        })
        setIsLoading(false)
      }
    )
  }
  // useEffect() {
  //   if (this.divRef.current) {
  //     const height = this.divRef.current.offsetHeight;
  //     console.log('Height of the div:', height);
  //   }
  // }
  return (
    <div className='line-chart-wrap'>
      <div className='line-chart__head' ref={headRef}>
        <div className='line-chart__head--left'>
          <div>
            <Text fontSize={18} fontWeight={700} className='mr-05'>
              {hoverValue}
            </Text>
            {/*
          <TextGrey className='mr-05' fontWeight={700}>
            {tokens[baseToken]?.symbol}/{tokens[quoteToken]?.symbol}
          </TextGrey>
          {
            changedIn24h >= 0
              ? <TextBuy>(+{changedIn24h}%)</TextBuy>
              : <TextSell>({changedIn24h}%)</TextSell>
          }
          */}
          </div>
          <div>
            <TextGrey>{moment(hoverDate).format(DATE_FORMATS.FULL)}</TextGrey>
          </div>
        </div>
        <div className='line-chart__head--right'>
          <Tabs tab={interval} setTab={setInterval} tabs={INTERVALS_TAB} />
        </div>
      </div>
      <div
        className='line-chart-box'
        style={{
          height: `${
            (isPhone ? 320 : 450) - (headRef.current?.offsetHeight || 53)
          }px`
        }}
      >
        {isLoading || !chartData[chainId + interval + cToken] ? (
          <div className='line-chart__loading'>
            <LineChartLoader />
          </div>
        ) : (
          <div
            className='line-chart__reload-icon'
            onClick={loadData}
            style={{
              display:
                chartData[chainId + interval + cToken].length > 0 ? 'none' : ''
            }}
          >
            <ReloadIcon />
          </div>
        )}
        {chartData[chainId + interval + cToken] &&
          chartData[chainId + interval + cToken].length > 0 && (
            <ResponsiveContainer>
              <AreaChart
                data={finalData}
                margin={{
                  top: 5,
                  right: 0,
                  left: 10,
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
                  tickFormatter={(time) =>
                    moment(time).format(interval === I_1D ? 'HH:mm' : 'DD/MM')
                  }
                  minTickGap={8}
                />
                <YAxis
                  dataKey='value'
                  tickFormatter={(tick) => {
                    return zerofy(tick)
                  }}
                  axisLine={false}
                  tickLine={false}
                  domain={['auto', 'auto']}
                  minTickGap={8}
                  orientation='right'
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
                <Area
                  dataKey='value'
                  type='linear'
                  stroke={color}
                  fill='url(#gradient)'
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
      </div>
    </div>
  )
}

const HoverUpdater = ({ payload, setHoverValue, setHoverDate }: any) => {
  useEffect(() => {
    setHoverValue(zerofy(payload.value))
    setHoverDate(payload.time)
  }, [payload.value, payload.time, setHoverValue, setHoverDate])

  return null
}

export const LineChart = React.memo(Component, (prevProps, nextProps) =>
  isEqual(prevProps, nextProps)
)
