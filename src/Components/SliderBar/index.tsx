import React, { useState } from 'react'
import './style.scss'
import isEqual from 'react-fast-compare'

const Component = ({
  minLeverage,
  maxLeverage,
  leverage,
  setLeverage,
  callBack
}: {
  minLeverage: number
  maxLeverage: number
  leverage: number
  setLeverage: any
  callBack?: any
}) => {
  const setProgress = (e: any) => {
    setLeverage(e.target.value)
  }

  return (
    <div style={{ width: '100%', height: '100px' }}>
      <input
        style={{ width: '100%' }}
        type='range'
        value={leverage}
        min={minLeverage}
        max={maxLeverage}
        onInput={setProgress}
      />
    </div>
  )
}

export const SliderBar = React.memo(Component, (prevProps, nextProps) =>
  isEqual(prevProps, nextProps)
)
