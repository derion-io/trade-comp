import React from 'react'
import { Tabs } from '../ui/Tabs'
import './style.scss'
import { CandleChart } from '../CandleChart'
import { LineChart } from '../LineChart'
import { IconArrowLeft } from '../ui/Icon'
import { TextBlue } from '../ui/Text'
import { useConfigs } from '../../state/config/useConfigs'
import isEqual from 'react-fast-compare'
import { SelectPoolGroup } from '../SelectPoolGroup'
import { useCurrentPool } from '../../state/currentPool/hooks/useCurrentPool'
import { FunctionPlot } from '../FuncPlot'
import { CHART_TABS } from '../../state/currentPool/type'

const Component = ({ changedIn24h }: { changedIn24h: number }) => {
  const { chainId, useHistory, configs } = useConfigs()
  const { chartTab, setChartTab } = useCurrentPool()
  const history = useHistory()
  // const [targetReached, setTargetReached] = useState(checkInnerWidth())

  return (
    <div className='chart-box'>
      <div className='chart__head'>
        <div className='chart__head--left'>
          <div
            className='exposure-page__head--back-btn'
            onClick={() => {
              history.push('pools')
            }}
          >
            <IconArrowLeft fill='#01A7FA' /> <TextBlue>Back</TextBlue>
          </div>
          <SelectPoolGroup />
        </div>
        {chainId !== 1337 && (
          <Tabs
            tab={chartTab}
            setTab={setChartTab}
            tabs={[
              { name: 'Candle Chart', value: CHART_TABS.CANDLE_CHART },
              { name: 'Line Chart', value: CHART_TABS.LINE_CHART },
              { name: 'Curve', value: CHART_TABS.FUNC_PLOT }
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
