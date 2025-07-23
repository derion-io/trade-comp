import {ApexOptions} from 'apexcharts'
import {BigNumber} from 'ethers'
import moment from 'moment'
import React,{useEffect,useMemo,useRef,useState} from 'react'
import ReactApexChart from 'react-apexcharts'
import isEqual from 'react-fast-compare'
import {ReloadIcon} from '../../Components/ui/Icon'
import {useExchangeData} from '../../hooks/useExchangeData'
import {useWindowSize} from '../../hooks/useWindowSize'
import {useConfigs} from '../../state/config/useConfigs'
import {useCurrentPoolGroup} from '../../state/currentPool/hooks/useCurrentPoolGroup'
import {LineChartData,PriceFeedDataCache} from '../../state/linechart/type'
import {useResource} from '../../state/resources/hooks/useResource'
import {COLORS} from '../../utils/constant'
import {bn,formatFloat,isChainlink,zerofyWithUnit} from '../../utils/helpers'
import {
  DATE_FORMATS,
  I_1D,
  INTERVAL_TO_GECKO,
  INTERVALS_TAB,
  LINE_CHART_CONFIG,
  LineChartIntervalType
} from '../../utils/lineChartConstant'
import {LineChartLoader} from '../ChartLoaders'
import {Tabs} from '../ui/Tabs'
import {Text,TextGrey} from '../ui/Text'
import './style.scss'

const Component = ({ changedIn24h }: { changedIn24h: number }) => {
  const { getLineChartData } = useExchangeData()
  const { baseToken, id, basePrice } = useCurrentPoolGroup()
  const { poolGroups } = useResource()

  const [hoverValue, setHoverValue] = useState<string>()
  const [chartData, setChartData] = useState<LineChartData[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [hoverDate, setHoverDate] = useState<number>()
  const [interval, setInterval] = useState<LineChartIntervalType>(I_1D)
  const { chainId, configs } = useConfigs()
  const headRef = useRef<HTMLDivElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  const { width } = useWindowSize()
  const isPhone = width && width < 768
  const currentPool = useMemo(() => poolGroups[id], [id, poolGroups])

  useEffect(() => {
    if (!chartData || id) {
      loadData()
    }
  }, [id, chainId, interval, currentPool])

  useEffect(() => {
    if (basePrice) {
      setHoverValue(zerofyWithUnit(formatFloat(basePrice)))
    }
    setHoverDate(new Date().getTime())
  }, [basePrice])


  const color = useMemo(() => {
    if (!chartData[0] || !chartData[chartData.length - 1]) {
      return COLORS.BUY
    }
    return Number(chartData[0].answer) < Number(chartData[chartData?.length - 1].answer) ? COLORS.BUY : COLORS.SELL
  }, [chartData])

  // ApexCharts series data
  const series = useMemo(() => {
    const seriesData = chartData.map(item => [
      Number(item.updatedAt),
      (item.answer),
    ])
    
    return [{
      name: 'Price',
      data: seriesData
    }]
  }, [chartData])

  // ApexCharts options
  const options: ApexOptions = useMemo(() => ({
    chart: {
      type: 'area',
      height: (isPhone ? 340 : 450) - (headRef.current?.offsetHeight || 53),
      width: (wrapRef.current?.offsetWidth || 1000) -   (isPhone ? 10 : 20),
      background: 'transparent',
      toolbar: {
        show: false
      },
      zoom: {
        enabled: false
      },
      animations: {
        enabled: false,
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
        dataPointMouseEnter: function(event, chartContext, config) {
          if (config.dataPointIndex >= 0 && chartData[config.dataPointIndex]) {
            const dataPoint = chartData[config.dataPointIndex]
            setHoverValue(zerofyWithUnit(dataPoint.answer))
            setHoverDate(dataPoint.updatedAt)
          }
        },
        mouseMove: function(event, chartContext, config) {
          if (config.dataPointIndex >= 0 && chartData[config.dataPointIndex]) {
            const dataPoint = chartData[config.dataPointIndex]
            setHoverValue(zerofyWithUnit(dataPoint.answer))
            setHoverDate(dataPoint.updatedAt)
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
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      },
      labels: {
        style: {
          colors: '#a0a0a0',
          fontSize: '12px'
        },
        datetimeFormatter: {
          year: 'yyyy',
          month: 'MMM \'yy',
          day: 'dd MMM',
          hour: 'HH:mm'
        },
        formatter: function(value) {
          return moment(value).format(LINE_CHART_CONFIG[interval].format || 'MMM-DD HH:mm')
        },
        offsetY: 0 // Add vertical space between x-axis and chart
      },
      tooltip: {
        enabled: false
      },
      offsetY: 0 // Add space between x-axis and chart
    },
    yaxis: {
      opposite: true,
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      },
      labels: {
        style: {
          colors: '#a0a0a0',
          fontSize: '12px'
        },
        formatter: function(value) {
          return zerofyWithUnit(value)
        },
        offsetX: 2 // Add horizontal space between y-axis and chart
      },
      offsetX: 2 // Add space between y-axis and chart
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
        right: 16, // Add right padding for y-axis
        bottom: 32, // Add bottom padding for x-axis
        left: 16 // Add left padding for y-axis
      }
    },
    tooltip: {
      enabled: true,
      theme: 'dark',
      style: {
        fontSize: '12px',
        fontFamily: 'Inter, sans-serif'
      },
      custom: function({ series, seriesIndex, dataPointIndex, w }) {
        const dataPoint = chartData[dataPointIndex]
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
              ${zerofyWithUnit(dataPoint.answer)}
            </div>
            <div style="
              color: #8B8B8B;
              font-size: 11px;
              font-weight: 400;
            ">
              ${moment(dataPoint.updatedAt).format('MMM DD, YYYY HH:mm')}
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
            height: 340 - (headRef.current?.offsetHeight || 53),
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
  }), [color, chartData, interval, isPhone, basePrice, wrapRef?.current ,headRef.current?.offsetHeight])

  const loadData = (action: 'PREV' | 'NEXT' | 'NONE' = 'NONE') => {
    setIsLoading(true)
    //  priceFeedData[chainId + interval + id] || []
    let _chartData = chartData
    _chartData = chartData?.filter(d => d.updatedAt >= start)
    const last = _chartData?.[_chartData.length - 1]
    const start = last?.updatedAt ? last?.updatedAt - (LINE_CHART_CONFIG[interval].range / 1000) : 0
    // /    console.log("#chartData", chartData, start)
    // console.log("#chartData", chartData)

    let from = BigNumber.from(0)
    if (action === 'PREV') {
      const firstItem = chartData[0]
      if (firstItem) {
        from = firstItem.roundId
      }
    } else if (action === 'NEXT') {
      const lastItem = chartData?.[chartData?.length - 1]
      if (lastItem) {
        from = lastItem.roundId
      }
    } else {
      from = BigNumber.from(0)
    }
    console.log("#chartData", chartData)
    if (from && currentPool?.ORACLE) {
      if (isChainlink(currentPool)) {
        const feedAddress = '0x' + currentPool?.ORACLE?.slice(26)
        getLineChartData({
          pair: feedAddress,
          baseToken,
          interval,
          action,
          from,
          onUpdate: (priceData) => {
            const chainIdStr = chainId.toString()
            if (!priceData?.[chainId.toString()] || !priceData?.[chainId.toString()][feedAddress] || Object.keys(priceData?.[chainId.toString()]?.[feedAddress])?.length === 0) {
              return;
            }

            let chartFinalData: LineChartData[] = Object.keys(priceData[chainIdStr][feedAddress]).map(round => {
              return {
                ...priceData[chainIdStr][feedAddress][round],
                roundId: bn(round)
              }
            }).sort((a,b) => a.updatedAt - b.updatedAt)

            const [firstData, lastData] = [chartFinalData[0], chartFinalData[chartFinalData.length - 1]]
            
            const start = lastData.updatedAt - LINE_CHART_CONFIG[interval].range
            const end = lastData.updatedAt
            chartFinalData = chartFinalData.filter(c => c.updatedAt >= start && c.updatedAt <= end)
            if (
              chartFinalData.length > 0 &&
              firstData.updatedAt >
              lastData.updatedAt - LINE_CHART_CONFIG[interval].range
            ) {
              chartFinalData.unshift({
                updatedAt:
                  lastData.updatedAt - LINE_CHART_CONFIG[interval].range,
                value: null,
                roundId: bn(0),
                answer: null
              } as any)
            }
          setChartData(chartFinalData)
          }
        })
          .then((data: PriceFeedDataCache) => {
            setIsLoading(false)
            if (!data?.[chainId.toString()] || !data?.[chainId.toString()][feedAddress] || Object.keys(data?.[chainId.toString()]?.[feedAddress])?.length === 0) {
              setChartData([])
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
      
      // const currentKey = chainId + interval + id;
      const currentData = chartData || [];
      let beforeTimestamp = undefined;
      if (action === 'PREV' && currentData.length > 0) {
        beforeTimestamp = Math.floor(currentData[0].updatedAt / 1000);
      } else if (action === 'NEXT' && currentData.length > 0) {
        beforeTimestamp = Math.floor(currentData[currentData.length - 1].updatedAt / 1000);
      }
      if (beforeTimestamp) {
        url += `&before_timestamp=${beforeTimestamp}`;
      }
      const res = await fetch(url);
      const json = await res.json();
      const ohlcvList: [number, number, number, number, number][] = json?.data?.attributes?.ohlcv_list || [];
      const chartDatas: LineChartData[] = ohlcvList.reverse().map((item: number[]) => ({
        updatedAt: item[0] * 1000,
        answer: item[4]?.toString(),
        roundId: bn(0)
      }));
      if (ohlcvList.length === 0) {
        throw "No gecko data";
      }
      setChartData(chartDatas);
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
        ref={wrapRef}
        style={{
          height: `${
            (isPhone ? 340 : 450) - (headRef.current?.offsetHeight || 53)
          }px`,
          width: "100%",
          position: 'relative',
          display: "flex",
          flexDirection: "column"
        }}
      >
        {isLoading || !chartData ? (
          <div className='line-chart__loading'>
            <LineChartLoader />
          </div>
        ) : (
          <div
            className='line-chart__reload-icon'
            onClick={() => loadData('NONE')}
            style={{
              display:
                chartData.length > 0 ? 'none' : 'flex',
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
        {chartData &&
          chartData.length > 0 &&
           options &&
           series[0]?.data?.length > 0 && (
        // @ts-ignore
          <ReactApexChart
            options={options}
            series={series as any}
            type="area"
            height={options.chart?.height}
            width={options.chart?.width}
          />
        )}
      </div>
    </div>
  )
}

export const LineChart = React.memo(Component, (prevProps, nextProps) =>
  isEqual(prevProps, nextProps)
)