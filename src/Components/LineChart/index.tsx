import {ApexOptions} from 'apexcharts'
import {BigNumber} from 'ethers'
import moment from 'moment'
import React,{useCallback, useEffect,useMemo,useRef,useState} from 'react'
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
  I_1Y,
  INTERVAL_TO_GECKO,
  INTERVALS_TAB,
  LINE_CHART_CONFIG,
  LineChartIntervalType
} from '../../utils/lineChartConstant'
import {LineChartLoader} from '../ChartLoaders'
import {Tabs} from '../ui/Tabs'
import {Text,TextGrey} from '../ui/Text'
import './style.scss'
import {uniqBy} from 'lodash'
import {State} from '../../state/types'
import {useSelector} from 'react-redux'

const Component = ({ changedIn24h }: { changedIn24h: number }) => {
  const { getLineChartData } = useExchangeData()
  const { priceDataState} = useSelector((state: State) => {
    return {
      priceDataState: state.linechart.priceData,
    }
  })
  const { baseToken, id, basePrice } = useCurrentPoolGroup()
  const { poolGroups } = useResource()

  const [hoverValue, setHoverValue] = useState<string>()
  const [chartData, setChartData] = useState<LineChartData[]>([])
  const [currentView, setCurrentView] = useState<{ts:number,firstRound:BigNumber, lastRound: BigNumber}>({
    ts: Date.now(),
    lastRound: bn(0),
    firstRound:bn(0),
  })
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [hoverDate, setHoverDate] = useState<number>()
  const [interval, setInterval] = useState<LineChartIntervalType>(I_1Y)
  const { chainId, configs } = useConfigs()
  const headRef = useRef<HTMLDivElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  const { width } = useWindowSize()
  const isPhone = width && width < 768
  const currentPool = useMemo(() => poolGroups[id], [id, poolGroups])
  useEffect(() => {
      loadData()
  }, [interval])

  useEffect(() => {
    setChartData([])
    const defaultCurrentV = {
      ts: Date.now(),
      firstRound: bn(0),
      lastRound: bn(0)
    }
    setCurrentView(defaultCurrentV)
    loadData("NONE", defaultCurrentV)
  },[currentPool, chainId])

  useEffect(() => {
    if (basePrice) {
      setHoverValue(zerofyWithUnit(formatFloat(basePrice)))
    }
    setHoverDate(new Date().getTime())
  }, [basePrice])


  const color = useMemo(() => {
    if(isLoading) {
      return COLORS.GRAY
    }
    const firstData = chartData[0]?.answer ? chartData[0] : chartData[1]
    const lastData = chartData[chartData.length - 1]
    if(!firstData || !lastData) {
      return COLORS.GRAY
    }
    return Number(firstData.answer) < Number(lastData.answer) ? COLORS.BUY : COLORS.SELL
  }, [chartData, isLoading])

  // ApexCharts series data
  const series = useMemo(() => {
    const seriesData: [number, number | null][] = chartData.map(item => [
      Number(item.updatedAt),
      item.answer ? Number(item.answer) : null,
    ])
    
    return [{
      name: 'Price',
      data: seriesData
    }]
  }, [chartData])

  // ApexCharts option
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

  const loadData = useCallback((action: 'PREV' | 'NEXT' | 'NONE' = 'NONE', currentViewOverride?: any) => {
    let _currentView = currentViewOverride || currentView
    const intervalRange = LINE_CHART_CONFIG[interval].range
    const feedAddress = '0x' + currentPool?.ORACLE?.slice?.(26)
    setIsLoading(true)
    //  priceFeedData[chainId + interval + id] || []
    // let _chartData = chartData
    // _chartData = chartData?.filter(d => d.updatedAt >= start)
    // const last = _chartData?.[_chartData.length - 1]
    // const start = last?.updatedAt ? last?.updatedAt - (intervalRange / 1000) : 0
    // /    console.log("#chartData", chartData, start)
    // console.log("#chartData", chartData)

    let from = BigNumber.from(0)

    // console.log("#chartData", chartData)
    if (currentPool?.ORACLE) {
      if (isChainlink(currentPool)) {
        // console.log("#crv", _currentView.ts, _currentView.firstRound.toString(), _currentView.lastRound.toString())
        if (action === 'PREV') {
          _currentView.ts -= intervalRange
          // const firstItem = chartData[0].answer ? chartData[0] : chartData[1]
          // const roundIds = priceDataRoundIds.filter(k => 
          //   priceDataState[chainId]?.[feedAddress]?.[k]?.updatedAt >= _currentView.ts &&
          //   priceDataState[chainId]?.[feedAddress]?.[k]?.updatedAt <= currentView.ts
          // ).map( e => Number(e))
          // const firstRoundId = roundIds?.length == 0 ? undefined : Math.min(...roundIds)
          // if (firstRoundId) {
            // from = bn(String(firstRoundId)) 
          // }
          from = _currentView.firstRound
        } else if (action === 'NEXT') {
          _currentView.ts += intervalRange
          // if(_currentView.ts > Date.now())
          //     _currentView.ts = Date.now()
          // const roundIds = priceDataRoundIds.filter(k =>
          //    priceDataState[chainId]?.[feedAddress]?.[k]?.updatedAt >= currentView.ts &&
          //    priceDataState[chainId]?.[feedAddress]?.[k]?.updatedAt <= _currentView.ts).map( e => Number(e))
          // const lastRoundId = roundIds?.length == 0 ? undefined : Math.min(...roundIds)
          // if (lastRoundId) {
          //   from = bn(String(lastRoundId)) 
          // }
          from = _currentView.lastRound
        } else {
          // const roundIds = priceDataRoundIds.filter(k => 
          //   priceDataState[chainId]?.[feedAddress]?.[k]?.updatedAt <= _currentView.ts).map( e => Number(e))
          const lastRoundId = _currentView?.lastRound
          // roundIds?.length == 0 ? bn(0) ? chartData[0]?.roundId : chartData[1]?.roundId
          //  : Math.max(...roundIds)
          if (lastRoundId) {
            from = bn(String(lastRoundId))
          } else {
            from = BigNumber.from(0)
          }
        }
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
            })
            const minTs = _currentView.ts - intervalRange
            const maxTs = _currentView.ts
            // console.log("#mm", new Date(minTs).toISOString(),new Date(maxTs).toISOString(), Object.keys(priceData[chainIdStr][feedAddress]).length)
            // if(action === "PREV") {
            //   // chartFinalData = chartFinalData.filter(c => c?.updatedAt <= chartData[0]?.updatedAt && c?.updatedAt >= chartData[0]?.updatedAt - intervalRange)
            //   chartFinalData = chartFinalData.filter(c => c?.updatedAt <= maxTs && c?.updatedAt >= minTs)
            // } else if (action == "NEXT"){
            //   chartFinalData = chartFinalData.filter(c => c?.updatedAt > minTs && c?.updatedAt < maxTs)
            //   if(chartFinalData.length === 0 ) {
            //     setIsLoading(false)
            //     return
            //   }; 
            // }
            chartFinalData = chartFinalData.filter(c => c?.updatedAt >= minTs && c?.updatedAt <= maxTs)
            chartFinalData = uniqBy(chartFinalData, "updatedAt")
            chartFinalData = chartFinalData.sort((a,b) => a.updatedAt - b.updatedAt)
      
            const [firstData, lastData] = [chartFinalData[0], chartFinalData[chartFinalData.length - 1]]
            if(!firstData || !lastData) return;
            // const start = lastData.updatedAt - intervalRange
            // const end = lastData.updatedAt
            // chartFinalData = chartFinalData.filter(c => c.updatedAt >= start && c.updatedAt <= end)
            // console.log("#chartFinalData.length", chartFinalData.length)
            _currentView.firstRound = bn(String(firstData?.roundId))
            _currentView.lastRound = bn(String(lastData?.roundId))
            chartFinalData = limitChartData(chartFinalData, LINE_CHART_CONFIG[interval].limit)
            if (
              chartFinalData.length > 0 &&
              firstData.updatedAt >
              lastData.updatedAt - intervalRange
            ) {
              chartFinalData.unshift({
                updatedAt:
                  _currentView.ts - intervalRange,
                value: null,
                roundId: bn(0),
                answer: null
              } as any)
            } else {
            }
          setCurrentView(_currentView)
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
        loadDataFromGecko(action).then(e => {
          setIsLoading(false)
        })
      }
    }
  }, [currentView, interval, currentPool, chartData, baseToken, chainId, getLineChartData, priceDataState])

  const loadDataFromGecko = useCallback(async (action: 'PREV' | 'NEXT' | 'NONE' = 'NONE') => {
    if (!currentPool?.ORACLE || currentPool?.ORACLE == "") return;
    setIsLoading(true);
    try {
      const intervalRange = LINE_CHART_CONFIG[interval].range
      const poolAddress = "0x" + currentPool?.ORACLE?.slice(26);
      const intervalConf = INTERVAL_TO_GECKO[interval];
      if (!poolAddress || !intervalConf) {
        setIsLoading(false);
        return;
      }
      let url = `https://api.geckoterminal.com/api/v2/networks/${configs.gtID}/pools/${poolAddress}/ohlcv/${intervalConf.timeframe}?aggregate=${intervalConf.aggregate}&include_empty_intervals=false&limit=300`;
      
      // const currentKey = chainId + interval + id;
      let _currentView = currentView;
      if (action === 'PREV') {
        _currentView.ts -= intervalRange;
      } else if (action === 'NEXT') {
        _currentView.ts += intervalRange;
      }
      url += `&before_timestamp=${Math.round(_currentView.ts / 1000)}`;
      const res = await fetch(url);
      const json = await res.json();
      const ohlcvList: [number, number, number, number, number][] = json?.data?.attributes?.ohlcv_list || [];
      if (ohlcvList.length === 0) {
        throw "No gecko data";
      }
      const chartDatas: LineChartData[] = ohlcvList.reverse().map((item: number[]) => ({
        updatedAt: item[0] * 1000,
        answer: item[4]?.toString(),
        roundId: bn(0)
      })).filter(e => e.updatedAt >= _currentView.ts - intervalRange && e.updatedAt <= _currentView.ts);
  
      if(chartDatas?.length > 0 && chartDatas[0]?.updatedAt < currentView.ts - intervalRange) {
        chartDatas.unshift({
          updatedAt: currentView.ts - intervalRange,
          answer: null,
          roundId: bn(0)
        } as any)
      }
      // console.log("#chartDatas", chartDatas)
      setCurrentView(_currentView)
      setChartData(chartDatas);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading GeckoTerminal chart data:', error);
      setIsLoading(false);
    }
  }, [currentPool, interval, configs.gtID, currentView])

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
          <span className='scroll-button' onClick={() => {
              if (!isLoading) loadData('PREV')
            }}>
            Prev
          </span>
          <span className='scroll-button' onClick={() => {
             if (!isLoading) loadData( 'NEXT')
            }}>
            Next
          </span>
          <span className='scroll-button'>
           {new Date(currentView.ts + 7 * 60 * 60 * 1000).toISOString()}

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
            series={series}
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

function limitChartData(data: LineChartData[], limit: number): LineChartData[] {
  if (limit < 2) return data;
  if (data.length <= limit) return data;

  const t0 = data[0].updatedAt;
  const tn = data[data.length - 1].updatedAt;

  const result: LineChartData[] = [data[0]];

  const spacing = (tn - t0) / (limit - 1);

  for (let i = 1; i < data.length-1; ++i) {
    if (data[i].updatedAt >= t0 + result.length*spacing) {
      result.push(data[i]);
    }
  }

  result.push(data[data.length - 1]);

  return result;
}
