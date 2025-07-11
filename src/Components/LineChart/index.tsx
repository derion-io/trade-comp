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
  I_1W,
  I_1M,
  I_6M,
  I_1Y,
  INTERVAL_TO_GECKO,
  INTERVALS_TAB,
  LINE_CHART_CONFIG,
  LineChartIntervalType
} from '../../utils/lineChartConstant'
import { Tabs } from '../ui/Tabs'
import { COLORS } from '../../utils/constant'
import isEqual from 'react-fast-compare'
import { useConfigs } from '../../state/config/useConfigs'
import { formatFloat, isChainlink, zerofyWithUnit } from '../../utils/helpers'
import { ReloadIcon } from '../../Components/ui/Icon'
import { useWindowSize } from '../../hooks/useWindowSize'
import { BigNumber, ethers } from 'ethers'
import { useCurrentPool } from '../../state/currentPool/hooks/useCurrentPool'

const Component = ({ changedIn24h }: { changedIn24h: number }) => {
  const { getLineChartData } = useExchangeData()
  const { baseToken, id, basePrice } = useCurrentPoolGroup()
  const { currentPool } = useCurrentPool()

  const [hoverValue, setHoverValue] = useState<string>()
  const [chartData, setChartData] = useState<{ [key: string]: any[] }>({})
  const [priceFeedData, setPriceFeedData] = useState<{ [key: string]: any[] }>({})
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [hoverDate, setHoverDate] = useState<number>()
  const [interval, setInterval] = useState<LineChartIntervalType>(I_1D)
  const { chainId, configs } = useConfigs()
  const headRef = useRef<HTMLDivElement>(null)
  const cToken = id
  const { width } = useWindowSize()
  const isPhone = width && width < 768
  useEffect(() => {
    if (!chartData[chainId + interval + cToken] || cToken) {
      loadData()
    }
  }, [cToken, chainId, interval,currentPool])

  useEffect(() => {
    if (basePrice) {
      setHoverValue(zerofyWithUnit(formatFloat(basePrice)))
    }
    setHoverDate(new Date().getTime())
  }, [basePrice])

  const yAxisDomain = useMemo(() => {
    const data = chartData[chainId + interval + cToken] || []
    if (data.length === 0) return ['auto', 'auto']
    
    const values = data.map(item => parseFloat(item.value)).filter(v => !isNaN(v))
    if (values.length === 0) return ['auto', 'auto']
    
    const minValue = Math.min(...values)
    const maxValue = Math.max(...values)
    
    const padding = (maxValue - minValue) * 0.1 // 10% padding
    const adjustedMin = Math.max(0, minValue - padding)
    const adjustedMax = maxValue + padding
    
    if (Math.abs(maxValue - minValue) < 0.0001) {
      return [adjustedMin * 0.95, adjustedMax * 1.05]
    }
    
    return [adjustedMin, adjustedMax]
  }, [chartData, interval, chainId, cToken])

  const finalData = useMemo(() => {
    const data = [...(chartData[chainId + interval + cToken] || [])]
    // if (data.length === 0) return []
    const smoothedData = []
    for (let i = 0; i < data.length; i++) {
      const current = data[i]
      const currentValue = parseFloat(current.value)
      
      if (i === 0) {
        smoothedData.push(current)
        continue
      }
      
      const previous = smoothedData[smoothedData.length - 1]
      const previousValue = parseFloat(previous.value)
      
      const percentChange = Math.abs((currentValue - previousValue) / previousValue)
      
      if (percentChange > 0.5) {
        // Use interpolated value
        const interpolatedValue = (currentValue + previousValue) / 2
        smoothedData.push({
          ...current,
          value: interpolatedValue.toString()
        })
      } else {
        smoothedData.push(current)
      }
    }
    return smoothedData
  }, [chartData, interval, chainId, cToken])

  const color = useMemo(() => {
    return changedIn24h > 0 ? COLORS.BUY : COLORS.SELL
  }, [changedIn24h])

  const loadData = (action: 'PREV' | 'NEXT' | 'NONE' = 'NONE') => {
    setIsLoading(true)
    const oldPriceFeedData = priceFeedData[chainId + interval + cToken] || []
    let from = BigNumber.from(0)
    if (action === 'PREV') {
      const firstItem = oldPriceFeedData[0]
      if (firstItem) {
        from = firstItem.roundId
      }
    } else if (action === 'NEXT') {
      const lastItem = oldPriceFeedData[oldPriceFeedData.length - 1]
      if (lastItem) {
        from = lastItem.roundId
      }
    } else {
      from = BigNumber.from(0)
    }

    if (from) {
      if(isChainlink(currentPool)) {
      getLineChartData({
        pair: "0x"+ currentPool?.ORACLE?.slice(26),
        //  cToken.split('-')[0].toLowerCase(),
        baseToken,
        interval,
        action,
        from,
        onUpdate: (data) =>  {
          setIsLoading(false)
          //console.log("#dataget", data[0].updatedAt.toString() , data[data.length - 1].updatedAt.toString() )
          const seen = new Set<string>()
          const allData = data.map(d => {
            return {
             roundId: d.roundId.toString(),
             updatedAt: d.updatedAt.toNumber(),
             startAt: d.startedAt.toNumber(),
             time: new Date(d.updatedAt.toNumber()).toISOString(),
             answer: d.answer.toString(),
             answeredInRound: d.answeredInRound.toString()
            }
          })
          console.log("#allRequestedData",allData)
          
          // Remove duplicates more effectively
          const uniqueData = allData.filter((item) => {
            if (seen.has(item.roundId)) {
              return false
            }
            seen.add(item.roundId)
            return true
          }).sort((a, b) => a.updatedAt - b.updatedAt)
          console.log("#uniqueData",uniqueData)
          setPriceFeedData({
            ...priceFeedData,
            [chainId + interval + cToken]: uniqueData
          })
  
          const chartDatas = uniqueData.map((item) => ({
            time: item.updatedAt * 1000,
            value: ethers.utils.formatUnits(item.answer, 8),
          }))
  
  
          // const msInterval = LINE_CHART_CONFIG[interval].interval || 60 * 1000
          
          if (chartDatas.length === 0) {
            setChartData({
              ...chartData,
              [chainId + interval + cToken]: []
            })
            setIsLoading(false)
            return
          }
  
          let lastData = chartDatas[chartDatas.length - 1]
          const start = lastData.time - LINE_CHART_CONFIG[interval].range
          const end = lastData.time 
  
          const result = []
          for (let i = 1; i < chartDatas.length; i++) {
            if (chartDatas[i].time < start) {
              continue
            }
            // if (chartDatas[i].time < lastData.time + msInterval) {
            //   continue;
            // }
            result.push(lastData = chartDatas[i])
            if (lastData.time >= end) {
              break
            }
          }
          if(result.length == 0) {
            setChartData({
              ...chartData,
              [chainId + interval + cToken]: []
            })
            setIsLoading(false)
            return
          }
          if(result[0].time > result[result.length -1].time - LINE_CHART_CONFIG[interval].range) {
            const additionalElements = []
            for (let i = 0; i < 5; i++) {
              additionalElements.push({
                time: result[result.length -1].time - LINE_CHART_CONFIG[interval].range + i,
                value: result[0].value
              })
            }
            result.unshift(...additionalElements)
          }
          console.log('#Line:', result)
  
          setChartData({
            ...chartData,
            [chainId + interval + cToken]: result
          })
          setIsLoading(false)
        }
      }).then((data) => {
       setIsLoading(false)
      }).catch((error) => {
        console.error('Error loading chart data:', error)
        setIsLoading(false)
      })
    } else {
      loadDataFromGecko(action)
    }
    }
  }
  const loadDataFromGecko = async (action: 'PREV' | 'NEXT' | 'NONE' = 'NONE') => {
    if(!currentPool?.ORACLE || currentPool?.ORACLE == "") return;
    setIsLoading(true);
    try {
      const poolAddress =  "0x" + currentPool?.ORACLE?.slice(26);
      const intervalConf = INTERVAL_TO_GECKO[interval];
      if (!poolAddress || !intervalConf) {
        setIsLoading(false);
        return;
      }
      let url = `https://api.geckoterminal.com/api/v2/networks/${configs.gtID}/pools/${poolAddress}/ohlcv/${intervalConf.timeframe}?aggregate=${intervalConf.aggregate}&include_empty_intervals=false&limit=300`;
      // Add before_timestamp if action is PREV or NEXT
      const currentKey = chainId + interval + cToken;
      const currentData = chartData[currentKey] || [];
      let beforeTimestamp = undefined;
      if (action === 'PREV' && currentData.length > 0) {
        beforeTimestamp = Math.floor(currentData[0].time / 1000); // first data point
      } else if (action === 'NEXT' && currentData.length > 0) {
        beforeTimestamp = Math.floor(currentData[currentData.length - 1].time / 1000); // last data point
      }
      if (beforeTimestamp) {
        url += `&before_timestamp=${beforeTimestamp}`;
      }
      const res = await fetch(url);
      const json = await res.json();
      const ohlcvList: [number, number, number, number, number][] = json?.data?.attributes?.ohlcv_list || [];
      const chartDatas = ohlcvList.reverse().map((item: number[]) => ({
        time: item[0] * 1000, // timestamp in ms
        value: item[4]?.toString() // close price as string
      }));
      if (ohlcvList.length === 0) {
        throw "No gecko data";
      }
      //console.log("#chartDatas", chartDatas);
      setChartData({
        ...chartData,
        [chainId + interval + cToken]: chartDatas
      });
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading GeckoTerminal chart data:', error);
      setIsLoading(false);
    }
  }
  // useEffect() {
  //   if (this.divRef.current) {
  //     const height = this.divRef.current.offsetHeight;
  //     //console.log('Height of the div:', height);
  //   }
  // }
  return (
    <div className='line-chart-wrap'>
      <div className='line-chart__head' ref={headRef}>
        <div className='line-chart__head--left'>
          <div className='price-display'>
            <Text fontSize={24} fontWeight={700} className='mr-05 price-value'>
              {hoverValue}
            </Text>
            <TextGrey className='price-date' fontSize={14}>
              {moment(hoverDate).format(DATE_FORMATS.FULL)}
            </TextGrey>
          </div>
        </div>
        <div className='line-chart__head--center'>
          <span className='scroll-button' onClick={() => loadData('PREV')}>
            Prev
          </span>
          <span className='scroll-button' onClick={() => loadData('NEXT')}>
            Next
          </span>
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
            onClick={() => loadData('NONE')}
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
                top: 10,
                right: 20,
                left: 10,
                bottom: 20
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
                  moment(time).format(LINE_CHART_CONFIG[interval].format || 'MMM-DD HH:mm')
                }
                minTickGap={60}
                interval="preserveEnd"
                tick={{ fill: '#a0a0a0', fontSize: 12 }}
                // padding={{ left: 20, right: 20 }}
              />
              <YAxis
                dataKey='value'
                tickFormatter={(tick) => {
                  return zerofyWithUnit(tick)
                }}
                axisLine={false}
                tickLine={false}
                domain={yAxisDomain}
                minTickGap={40}
                tickCount={8}
                orientation='right'
                tick={{ fill: '#a0a0a0', fontSize: 12 }}
                padding={{ top: 10, bottom: 10 }}
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
                type='monotone'
                stroke={color}
                connectNulls
                fill='url(#gradient)'
                strokeWidth={2}
                dot={false}
                activeDot={{
                  r: 6,
                  fill: color,
                  stroke: '#fff',
                  strokeWidth: 2
                }}
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
    if (payload && payload.value !== undefined ) {
      setHoverValue(zerofyWithUnit(payload.value))
    }
    if(payload && payload.time !== undefined) {
      setHoverDate(payload.time)
    }
  }, [payload?.value, payload?.time, setHoverValue, setHoverDate])

  return null
}

export const LineChart = React.memo(Component, (prevProps, nextProps) =>
  isEqual(prevProps, nextProps)
)