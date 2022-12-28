import React, { useState } from 'react'
import { Tabs } from '../ui/Tabs'
import './style.scss'
import { CandleChart } from '../CandleChart'
import { LineChart } from '../LineChart'

const CANDLE_CHART = Symbol('candle')
const LINE_CHART = Symbol('line')

export const Chart = ({ changedIn24h }: {changedIn24h: number}) => {
  const [tab, setTab] = useState<Symbol>(CANDLE_CHART)

  return <div className='chart-box'>
    <div className='chart__head'>
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
      tab === CANDLE_CHART && <CandleChart />
    }
    {
      tab === LINE_CHART && <LineChart changedIn24h={changedIn24h} />
    }
  </div>
}
