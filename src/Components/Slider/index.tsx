import React, { useState } from 'react'
import { BarChart, Bar } from 'recharts'
import './style.scss'
import isEqual from 'react-fast-compare'
import Slider from 'rc-slider'

const renderBar = (barData: any, barColor: any) => {
  const barArray = []

  for (let i = 0; i < barData.length; i++) {
    barArray.push(<Bar dataKey={barData[i]} stackId='a' fill={barColor[i]} />)
  }

  return barArray
}

const StackedBarChart = ({
  xDisplay,
  barData,
  barColor,
  height = 0
}: {
  height?: number
  xDisplay: string
  barData?: {}
  barColor?: {}
}) => {
  const rightPixel = xDisplay.length === 2 ? '-7px' : '-4px'
  const barDataEntriesKeys = Object.keys(barData || [])
  const barColorValues = []
  const code = 'a'.charCodeAt(0)
  for (let i = 0; i < Object.keys(barColor || {}).length; i++) {
    barColorValues.push(barColor?.[String.fromCharCode(code + i)])
  }
  return (
    <div style={{ position: 'relative' }}>
      {xDisplay}
      {xDisplay === '0x' ? (
        <div />
      ) : (
        <div style={{ position: 'absolute', top: -height - 30, right: rightPixel }}>
          <BarChart width={30} height={height} data={[barData]}>
            {renderBar(barDataEntriesKeys, barColorValues)}
            {/* <Bar dataKey='a' stackId='a' fill='aqua' />
            <Bar dataKey='b' stackId='a' fill='green' /> */}
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
      barData[initToChar(i)] = data[i].size
    }
    return barData
  }

  const getMark = () => {
    const finalData = {}
    // const barData = {}
    leverageData.map((data: any) => {
      console.log(data)
      finalData[data.x] = (
        <StackedBarChart
          height={height}
          xDisplay={data.xDisplay}
          barData={getBarData(data.bars)}
          barColor={getBarColor(data.bars)}
        />
      )
    })

    return {
      ...finalData,
      0: <StackedBarChart xDisplay='0x' />
    }
  }

  return (
    <div style={{ marginTop: height + 30, marginBottom: 35, paddingRight: 15, paddingLeft: 15 }}>
      <Slider
        min={0}
        max={leverageData[leverageData.length - 1].x}
        step={null}
        count={1}
        value={leverage}
        onChange={(e: number) => {
          setLeverage(e)
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
