import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useExchangeData } from '../../hooks/useExchangeData'
import { LineChartLoader } from '../ChartLoaders'
import { ApexOptions } from 'apexcharts'
import './style.scss'
import { useCurrentPoolGroup } from '../../state/currentPool/hooks/useCurrentPoolGroup'
import moment from 'moment'
import { Text, TextGrey } from '../ui/Text'
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
import { useResource } from '../../state/resources/hooks/useResource'
import ReactApexChart from 'react-apexcharts'

const Component = ({ changedIn24h }: { changedIn24h: number }) => {
  const { getLineChartData } = useExchangeData()
  const { baseToken, id, basePrice } = useCurrentPoolGroup()
  const { poolGroups } = useResource()

  const [hoverValue, setHoverValue] = useState<string>()
  const [chartData, setChartData] = useState<{ [key: string]: any[] }>({})
  const [priceFeedData, setPriceFeedData] = useState<{ [key: string]: any[] }>({})
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [hoverDate, setHoverDate] = useState<number>()
  const [interval, setInterval] = useState<LineChartIntervalType>(I_1D)
  const { chainId, configs } = useConfigs()
  const headRef = useRef<HTMLDivElement>(null)
  const { width } = useWindowSize()
  const isPhone = width && width < 768
  const currentPool = useMemo(() => poolGroups[id], [id, poolGroups])
  const [ApexOptions, setApexOptions] = useState<ApexOptions | undefined>()
  useEffect(() => {
    if (!chartData[chainId + interval + id] || id) {
      loadData()
    }
  }, [id, chainId, interval, currentPool])

  useEffect(() => {
    if (basePrice) {
      setHoverValue(zerofyWithUnit(formatFloat(basePrice)))
    }
    setHoverDate(new Date().getTime())
  }, [basePrice])

  const finalData = useMemo(() => {
    const data = [...(chartData[chainId + interval + id] || [])]
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
  }, [chartData, interval, chainId, id])

  const color = useMemo(() => {
    if (!finalData[0] || !finalData[finalData.length - 1]) {
      return COLORS.BUY
    }
    return Number(finalData[0].value) < Number(finalData[finalData?.length - 1].value) ? COLORS.BUY : COLORS.SELL
  }, [finalData])

  // ApexCharts series data
  const series = useMemo(() => {
    const seriesData = finalData.map(item => [
      item.time,
      parseFloat(item.value)
    ])
    
    return [{
      name: 'Price',
      data: seriesData
    }]
  }, [finalData])

  // ApexCharts options
  // const options: ApexOpt/ions =
  useEffect(() => {
    setApexOptions({
      chart: {
        type: 'area',
        height: (isPhone ? 320 : 450) - (headRef.current?.offsetHeight || 53),
        width: "100%",
        background: 'transparent',
        toolbar: {
          show: false
        },
        zoom: {
          enabled: false
        },
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800,
          animateGradually: {
            enabled: true,
            delay: 150
          },
          dynamicAnimation: {
            enabled: true,
            speed: 350
          }
        },
        events: {
          dataPointMouseEnter: function(event:any, chartContext:any, config:any) {
            if (config.dataPointIndex >= 0 && finalData[config.dataPointIndex]) {
              const dataPoint = finalData[config.dataPointIndex]
              setHoverValue(zerofyWithUnit(dataPoint.value))
              setHoverDate(dataPoint.time)
            }
          },
          mouseMove: function(event:any, chartContext:any, config:any) {
            if (config.dataPointIndex >= 0 && finalData[config.dataPointIndex]) {
              const dataPoint = finalData[config.dataPointIndex]
              setHoverValue(zerofyWithUnit(dataPoint.value))
              setHoverDate(dataPoint.time)
            }
          },
          mouseLeave: function() {
            if (basePrice) {
              setHoverValue(zerofyWithUnit(formatFloat(basePrice)))
              setHoverDate(new Date().getTime())
            }
          }
        },
        sparkline: {
          enabled: false
        },
        parentHeightOffset: 0,
        redrawOnParentResize: true,
        redrawOnWindowResize: true
      },
      stroke: {
        curve: 'smooth',
        width: 3,
        colors: [color],
        lineCap: 'round'
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'dark',
          gradientToColors: [color],
          shadeIntensity: 1,
          type: 'vertical',
          opacityFrom: 0.4,
          opacityTo: 0.05,
          stops: [0, 100],
          colorStops: [
            {
              offset: 0,
              color: color,
              opacity: 0.4
            },
            {
              offset: 100,
              color: color,
              opacity: 0.05
            }
          ]
        }
      },
      colors: [color],
      dataLabels: {
        enabled: false
      },
      markers: {
        size: 0,
        strokeWidth: 3,
        strokeOpacity: 0.9,
        strokeColors: [color],
        fillOpacity: 1,
        discrete: [],
        shape: 'circle',
        radius: 2,
        hover: {
          size: 8,
          sizeOffset: 3
        },
        colors: [color]
      },
      xaxis: {
        type: 'datetime',
        range: undefined,
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        },
        labels: {
          show: true,
          style: {
            colors: '#8B8B8B',
            fontSize: '11px',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 400
          },
          datetimeUTC: false,
          format: 'HH:mm',
          datetimeFormatter: {
            year: 'yyyy',
            month: 'MMM \'yy',
            day: 'dd MMM',
            hour: 'HH:mm'
          }
        },
        crosshairs: {
          show: true,
          width: 1,
          position: 'back',
          opacity: 0.6,
          stroke: {
            color: '#8B8B8B',
            width: 1,
            dashArray: 0
          }
        },
        tooltip: {
          enabled: false
        }
      },
      yaxis: {
        show: true,
        opposite: true,
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        },
        labels: {
          show: true,
          align: 'right',
          minWidth: 0,
          maxWidth: 160,
          style: {
            colors: '#8B8B8B',
            fontSize: '11px',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 400
          },
          formatter: function(value: any) {
            return zerofyWithUnit(value)
          }
        },
        crosshairs: {
          show: true,
          position: 'back',
          stroke: {
            color: '#8B8B8B',
            width: 1,
            dashArray: 0
          }
        }
      },
      grid: {
        show: true,
        borderColor: '#2A2A2A',
        strokeDashArray: 0,
        position: 'back',
        xaxis: {
          lines: {
            show: false
          }
        },
        yaxis: {
          lines: {
            show: true
          }
        },
        row: {
          colors: undefined,
          opacity: 0.5
        },
        column: {
          colors: undefined,
          opacity: 0.5
        },
        padding: {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0
        }
      },
      tooltip: {
        enabled: true,
        theme: 'dark',
        style: {
          fontSize: '12px',
          fontFamily: 'Inter, sans-serif'
        },
        custom: function({ series, seriesIndex, dataPointIndex, w }: any) {
          const dataPoint = finalData[dataPointIndex]
          if (!dataPoint) return ''
          
          return `
            <div style="
              background: linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(20,20,20,0.95) 100%);
              border: 1px solid ${color};
              border-radius: 8px;
              padding: 12px 16px;
              box-shadow: 0 8px 32px rgba(0,0,0,0.3);
              backdrop-filter: blur(10px);
              min-width: 160px;
            ">
              <div style="
                color: ${color};
                font-weight: 600;
                font-size: 14px;
                margin-bottom: 4px;
              ">
                ${zerofyWithUnit(dataPoint.value)}
              </div>
              <div style="
                color: #8B8B8B;
                font-size: 11px;
                font-weight: 400;
              ">
                ${moment(dataPoint.time).format('MMM DD, YYYY HH:mm')}
              </div>
            </div>
          `
        }
      },
      legend: {
        show: false
      },
      responsive: [
        {
          breakpoint: 768,
          options: {
            chart: {
              height: 320 - (headRef.current?.offsetHeight || 53),
            },
            stroke: {
              width: 2
            },
            markers: {
              hover: {
                size: 6
              }
            }
          }
        }
      ]
    } as any)
  }, [color, finalData, interval, isPhone, basePrice, headRef.current?.offsetHeight])

  const loadData = (action: 'PREV' | 'NEXT' | 'NONE' = 'NONE') => {
    setIsLoading(true)
    const oldPriceFeedData = priceFeedData[chainId + interval + id] || []
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
    console.log("#chartData", chartData)
    if (from && currentPool?.ORACLE) {
      if (isChainlink(currentPool)) {
        getLineChartData({
          pair: '0x' + currentPool?.ORACLE?.slice(26),
          baseToken,
          interval,
          action,
          from,
          onUpdate: (data, isPreLoad) => {
            // const res = chartData[chainId + "1D" + id]
            // console.log("#chartData", chartData)
            // console.log("#res", chainId + "1D" + id, res)

            // if (isPreLoad && res && res.length > 0) {
            //   res.unshift({
            //     time: res[res.length - 1].time -
            //       LINE_CHART_CONFIG[interval].range,
            //     value: res[0].value
            //   })
            //   setChartData({
            //     ...chartData,
            //     [chainId + interval + id]: res
            //   })
            //   console.log("#preload", res)
            //   return;
            // }
            if (data.length == 0) {
              setIsLoading(true)
              return
            }
            setIsLoading(false)
            const seen = new Set<string>()
            const allData = data.map((d) => {
              return {
                roundId: d.roundId.toString(),
                updatedAt: d.updatedAt.toNumber(),
                startAt: d.startedAt.toNumber(),
                time: new Date(d.updatedAt.toNumber()).toISOString(),
                answer: d.answer.toString(),
                answeredInRound: d.answeredInRound.toString()
              }
            })

            const uniqueData = allData
              .filter((item) => {
                if (seen.has(item.roundId)) {
                  return false
                }
                seen.add(item.roundId)
                return true
              })
              .sort((a, b) => a.updatedAt - b.updatedAt)
            console.log('#uniqueData', uniqueData)
            setPriceFeedData({
              ...priceFeedData,
              [chainId + interval + id]: uniqueData
            })

            const chartDatas = uniqueData.map((item) => ({
              time: item.updatedAt * 1000,
              value: ethers.utils.formatUnits(item.answer, 8)
            }))

            let lastData = chartDatas[chartDatas.length - 1]
            const start = lastData.time - LINE_CHART_CONFIG[interval].range
            const end = lastData.time

            const result = []
            for (let i = 1; i < chartDatas.length; i++) {
              if (chartDatas[i].time < start) {
                continue
              }
              result.push((lastData = chartDatas[i]))
              if (lastData.time >= end) {
                break
              }
            }
            if (
              result.length > 0 &&
              result[0].time >
              result[result.length - 1].time - LINE_CHART_CONFIG[interval].range
            ) {
              const additionalElements = []
              additionalElements.push({
                time:
                  result[result.length - 1].time -
                  LINE_CHART_CONFIG[interval].range,
                value: result[0].value
              })
              result.unshift(...additionalElements)
            }
            console.log('#Line:', result)
            if (result.length == 0) return;
            setChartData({
              ...chartData,
              [chainId + interval + id]: result
            })
            setIsLoading(false)
          }
        })
          .then((data) => {
            setIsLoading(false)
            if (data.length === 0) {
              setChartData({
                ...chartData,
                [chainId + interval + id]: []
              })
              return
            }
          })
          .catch((error) => {
            console.error('Error loading chart data:', error)
            setIsLoading(false)
          })
      } else {
        loadDataFromGecko(action)
      }
    }
  }

  const loadDataFromGecko = async (action: 'PREV' | 'NEXT' | 'NONE' = 'NONE') => {
    if (!currentPool?.ORACLE || currentPool?.ORACLE == "") return;
    setIsLoading(true);
    try {
      const poolAddress = "0x" + currentPool?.ORACLE?.slice(26);
      const intervalConf = INTERVAL_TO_GECKO[interval];
      if (!poolAddress || !intervalConf) {
        setIsLoading(false);
        return;
      }
      let url = `https://api.geckoterminal.com/api/v2/networks/${configs.gtID}/pools/${poolAddress}/ohlcv/${intervalConf.timeframe}?aggregate=${intervalConf.aggregate}&include_empty_intervals=false&limit=300`;
      
      const currentKey = chainId + interval + id;
      const currentData = chartData[currentKey] || [];
      let beforeTimestamp = undefined;
      if (action === 'PREV' && currentData.length > 0) {
        beforeTimestamp = Math.floor(currentData[0].time / 1000);
      } else if (action === 'NEXT' && currentData.length > 0) {
        beforeTimestamp = Math.floor(currentData[currentData.length - 1].time / 1000);
      }
      if (beforeTimestamp) {
        url += `&before_timestamp=${beforeTimestamp}`;
      }
      const res = await fetch(url);
      const json = await res.json();
      const ohlcvList: [number, number, number, number, number][] = json?.data?.attributes?.ohlcv_list || [];
      const chartDatas = ohlcvList.reverse().map((item: number[]) => ({
        time: item[0] * 1000,
        value: item[4]?.toString()
      }));
      if (ohlcvList.length === 0) {
        throw "No gecko data";
      }
      setChartData({
        ...chartData,
        [chainId + interval + id]: chartDatas
      });
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading GeckoTerminal chart data:', error);
      setIsLoading(false);
    }
  }

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
          height: "100%",
          // `${
          //   (isPhone ? 320 : 450) - (headRef.current?.offsetHeight || 53)
          // }px`,
          width: "100%",
          minWidth: "100%",
          position: 'relative',
          display: "flex",
          flexDirection: "column"
        }}
      >
        {isLoading || !chartData[chainId + interval + id] ? (
          <div className='line-chart__loading'>
            <LineChartLoader />
          </div>
        ) : (
          <div
            className='line-chart__reload-icon'
            onClick={() => loadData('NONE')}
            style={{
              display:
                chartData[chainId + interval + id].length > 0 ? 'none' : 'flex',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 10
            }}
          >
            <ReloadIcon />
          </div>
        )}
        {chartData[chainId + interval + id] &&
          chartData[chainId + interval + id].length > 0 &&
           ApexOptions &&
           series[0]?.data?.length > 0 && (
        // @ts-ignore
          <ReactApexChart
            options={ApexOptions}
            series={series}
            type="area"
             width="100%"
            height={ApexOptions.chart?.height}
          />
        )}
      </div>
    </div>
  )
}

export const LineChart = React.memo(Component, (prevProps, nextProps) =>
  isEqual(prevProps, nextProps)
)