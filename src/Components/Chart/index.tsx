import React from 'react'
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
import { formatFloat, formatZeroDecimal } from '../../utils/helpers'

const Component = ({ changedIn24h }: { changedIn24h: number }) => {
  const { chainId, configs } = useConfigs()
  const { chartTab, setChartTab, basePrice, id } = useCurrentPoolGroup()

  return (
    <div className='chart-box'>
      <div className='chart__head'>
        <div className='chart__head--left'>
          <SelectPoolGroup />
          {
            id &&
            <span>
              <Text>{formatZeroDecimal(formatFloat(basePrice))}</Text>
              {
                changedIn24h > 0
                  ? <TextBuy>(+{changedIn24h}%)</TextBuy>
                  : <TextSell>({changedIn24h}%)</TextSell>
              }
            </span>
          }

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
      {chainId !== 1337 &&
      (chartTab === CHART_TABS.LINE_CHART && configs.theGraphExchange
        ? <LineChart changedIn24h={changedIn24h} />
        : chartTab === CHART_TABS.FUNC_PLOT
          ? <FunctionPlot />
          : <CandleChart />
      )
      }
    </div>
  )
}

export const Chart = React.memo(Component, (prevProps, nextProps) =>
  isEqual(prevProps, nextProps)
)
