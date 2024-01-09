import React, { useEffect, useMemo, useState } from 'react'
import { Tabs } from '../ui/Tabs'
import './style.scss'
import { CandleChart } from '../CandleChart'
import { LineChart } from '../LineChart'
import { Text, TextBuy, TextSell } from '../ui/Text'
import { useConfigs } from '../../state/config/useConfigs'
import isEqual from 'react-fast-compare'
import { SelectPoolGroup } from '../SelectPoolGroup'
import { useCurrentPoolGroup } from '../../state/currentPool/hooks/useCurrentPoolGroup'
import { FunctionPlot } from '../FuncPlot'
import { CHART_TABS } from '../../state/currentPool/type'
import { formatFloat, zerofy } from '../../utils/helpers'
import { useCurrentPool } from '../../state/currentPool/hooks/useCurrentPool'
import { useNativePrice } from '../../hooks/useTokenPrice'
import { useResource } from '../../state/resources/hooks/useResource'
import { Card } from '../ui/Card'

const Component = ({ changedIn24h }: { changedIn24h: number }) => {
  const { chainId, configs } = useConfigs()
  const { chartTab, setChartTab, basePrice, id, chartIsOutDate } = useCurrentPoolGroup()
  const { data: nativePrice } = useNativePrice()
  const { currentPool, priceByIndexR } = useCurrentPool()
  const { poolGroups } = useResource()
  const [isUseDextool, setUseDexTool] = useState<boolean>(false)
  const pairAddress = poolGroups[id] ? '0x' + (poolGroups[id]?.ORACLE as String).slice(poolGroups[id]?.ORACLE.length - 40, poolGroups[id]?.ORACLE.length) : ''
  useEffect(() => {
    if (chartIsOutDate) {
      setUseDexTool(true)
      console.log('#isUseDextool', isUseDextool)
    }
  }, [chartIsOutDate])
  return (
    <div className='chart-box'>
      <div className='chart__head'>
        <div className='chart__head--left'>
          <SelectPoolGroup />
          {!!id && basePrice && (
            <span>
              <Text>
                {priceByIndexR &&
                 [configs.wrappedTokenAddress, ...Object.keys(configs.tokens || {})]
                   .includes(currentPool?.quoteToken)
                  ? zerofy(formatFloat(basePrice))
                  : '$' + zerofy(formatFloat(basePrice) * (
                    currentPool?.quoteToken === configs.wrappedTokenAddress
                      ? nativePrice
                      : 1))
                }

              </Text>
              {changedIn24h > 0 ? (
                <TextBuy>(+{changedIn24h}%)</TextBuy>
              ) : (
                <TextSell>({changedIn24h}%)</TextSell>
              )}
            </span>
          )}
        </div>
        {chainId !== 1337 && (
          <Tabs
            tab={chartTab}
            setTab={setChartTab}
            tabs={[
              { name: 'Candles', value: CHART_TABS.CANDLE_CHART },
              { name: 'Lines', value: CHART_TABS.LINE_CHART },
              { name: 'Curves', value: CHART_TABS.FUNC_PLOT }
            ]}
          />
        )}
      </div>
      {/* {tab === CANDLE_CHART && configs.candleChartApi ? (
        <CandleChart />
      ) : (
        <div />
      )} */}
      <div className='chart-wrap ergawe'>
        {chainId !== 1337 &&
          // @ts-ignore
          (chartTab === CHART_TABS.LINE_CHART && configs.subGraph ? (
            <LineChart changedIn24h={changedIn24h} />
          ) : chartTab === CHART_TABS.FUNC_PLOT ? (
            currentPool?.states && <FunctionPlot />
          ) : (
            isUseDextool ? <DexToolChart pairAddress={pairAddress} chartResolution='1'/> : <CandleChart/>
          ))}
      </div>
    </div>
  )
}
export const DexToolChart = (props: { pairAddress: string | undefined, chartResolution: string }) => {
  return (
    <Card className='candle-chart-wrap' >
      { props.pairAddress
        ? <div
          className='candle-chart-box'
        >
          <iframe id='dextools-widget'
            title='DEXTools Trading Chart'
            style={{
              width: '100%',
              height: 'calc(100% + 40px)',
              position: 'absolute',
              top: '-40px',
              border: 'none'
            }}
            src={`https://www.dextools.io/widget-chart/en/bnb/pe-light/${props?.pairAddress.toLowerCase()}?theme=dark&tvPlatformColor=1b1d21&tvPaneColor=131722&chartType=1&chartResolution=${props.chartResolution || '1'}&drawingToolbars=false`} />
        </div>
        : 'Dextools Loading'}
    </Card>
  )
}
export const Chart = React.memo(Component, (prevProps, nextProps) =>
  isEqual(prevProps, nextProps)
)
