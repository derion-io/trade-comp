import React, { useEffect, useMemo } from 'react'
import { BarChart, Bar } from 'recharts'
import './style.scss'
import isEqual from 'react-fast-compare'
import Slider from 'rc-slider'

const renderBar = (barData: any, barDataEntriesKeys: any, barColor: any, setLeverage: any) => {
  const barArray = []
  for (let i = 0; i < barDataEntriesKeys.length; i++) {
    barArray.push(
      <Bar
        dataKey={barDataEntriesKeys[i]}
        stackId='a'
        fill={barColor[i]}
        onClick={() => {
          setLeverage(barData[barDataEntriesKeys[i]])
        }}
      />
    )
  }

  return barArray
}
const StackedBarChart = ({
  xDisplay,
  barData,
  barColor,
  height = 0,
  setLeverage
}: {
  height?: number
  xDisplay: string
  barData?: {}
  barColor?: {}
  setLeverage: any
}) => {
  const rightPixel = xDisplay.length === 2 ? '-7px' : '-4px'
  const barDataEntriesKeys = Object.keys(barData || [])
  const barColorValues = []
  const barSize = []
  const code = 'a'.charCodeAt(0)
  for (let i = 0; i < Object.keys(barColor || {}).length; i++) {
    barColorValues.push(barColor?.[String.fromCharCode(code + i)])
    barSize.push(barData?.[String.fromCharCode(code + i)]?.size)
  }
  const barTotalSize = barSize.reduce((accumulator, value) => {
    return accumulator + value
  }, 0)

  const barSizeData = useMemo(() => {
    const result = {}
    for (const i in barData) {
      result[i] = barData[i].size
    }
    return result
  }, [barData])

  return (
    <div style={{ position: 'relative', padding: '0' }}>
      {xDisplay}
      {xDisplay === '0x' ? (
        <div />
      ) : (
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            top: `${
              barTotalSize === 100
                ? `-${height + 30}px`
                : `-${height + 30 - (100 - barTotalSize)}px`
            }`,
            right: rightPixel
          }}
        >
          <BarChart className='d-flex' width={30} height={barTotalSize < 1 ? 1 : barTotalSize} data={[barSizeData]}>
            {renderBar(barData, barDataEntriesKeys, barColorValues, setLeverage)}
          </BarChart>
        </div>
      )}
    </div>
  )
}

const Component = ({ leverage, setLeverage, leverageData, height }: {height: number, leverageData: any, leverage: number, setLeverage: any}) => {
  const initToChar = (num: any) => {
    const code = 'a'.charCodeAt(0)
    return String.fromCharCode(code + num)
  }

  const getBarColor = (data: any) => {
    const barColor = {}
    for (let i = 0; i < data.length; i++) {
      barColor[initToChar(i)] = data[i].color
    }
    return barColor
  }

  const getBarData = (data: any) => {
    const barData = {}
    for (let i = 0; i < data.length; i++) {
      barData[initToChar(i)] = data[i]
    }
    return barData
  }

  const getMark = () => {
    const finalData = {}
    // const barData = {}
    leverageData.map((data: any) => {
      finalData[data.x] = (
        <StackedBarChart
          height={height}
          xDisplay={data.xDisplay}
          barData={getBarData(data.bars)}
          barColor={getBarColor(data.bars)}
          setLeverage={setLeverage}
        />
      )
    })

    return {
      ...finalData
    }
  }

  useEffect(() => {
    if (leverage === 0 && leverageData && leverageData[0]?.bars.length > 0) {
      setLeverage(leverageData[0].bars[0])
    }
  }, [leverage])

  return (
    <div style={{ marginTop: height + 30, marginBottom: 35, paddingRight: 15, paddingLeft: 15 }}>
      <Slider
        min={leverageData[0].x}
        max={leverageData[leverageData.length - 1].x}
        step={null}
        count={1}
        value={leverage}
        onChange={(e: number) => {
          const data = leverageData.find((d: any) => {
            return d.x === e
          })

          if (data?.bars[0]) {
            setLeverage(data.bars[0])
          }
        }}
        dotStyle={{
          background: '#303236',
          borderRadius: '2px',
          width: '1px',
          borderColor: '#303236',
          borderWidth: '2px',
          bottom: '-1px'
        }}
        trackStyle={{ backgroundColor: '#03c3ff', height: 2 }}
        handleStyle={{
          backgroundColor: 'white',
          borderColor: '#03c3ff',
          borderWidth: '2px'
        }}
        activeDotStyle={{
          borderColor: '#03c3ff'
        }}
        marks={getMark()}
        railStyle={{ backgroundColor: '#303236', height: '2px' }}
      />
    </div>
  )
}

export const LeverageSlider = React.memo(Component, (prevProps, nextProps) =>
  isEqual(prevProps, nextProps)
)
