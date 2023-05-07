import React, { useState } from 'react'
import { Tabs } from '../ui/Tabs'
import './style.scss'
import { CandleChart } from '../CandleChart'
import { LineChart } from '../LineChart'
import { IconArrowLeft } from '../ui/Icon'
import { TextBlue } from '../ui/Text'
import { useConfigs } from '../../state/config/useConfigs'
import isEqual from 'react-fast-compare'

const CANDLE_CHART = Symbol('candle')
const LINE_CHART = Symbol('line')

const Component = ({ changedIn24h }: {changedIn24h: number}) => {
  const [tab, setTab] = useState<Symbol>(CANDLE_CHART)
  const { useHistory, configs } = useConfigs()
  const history = useHistory()

  return <div className='chart-box'>
    <div className='chart__head'>
      <div
        className='exposure-page__head--back-btn'
        onClick={() => {
          history.push('pools')
        }}
      >
        <IconArrowLeft fill='#01A7FA' /> <TextBlue>Back</TextBlue>
      </div>
      <Tabs
        tab={tab}
        setTab={setTab}
        tabs={[
          { name: 'Candle Chart', value: CANDLE_CHART },
          { name: 'Line Chart', value: LINE_CHART }
        ]}
      />
    </div>
    {
      tab === CANDLE_CHART && configs.candleChartApi ? <CandleChart /> : <div/>
    }
    {
      tab === LINE_CHART && configs.theGraphExchange ? <LineChart changedIn24h={changedIn24h} /> : <div/>
    }
  </div>
}

export const Chart = React.memo(Component, (prevProps, nextProps) =>
  isEqual(prevProps, nextProps)
)
