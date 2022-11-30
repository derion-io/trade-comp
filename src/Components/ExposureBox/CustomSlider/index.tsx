import Slider from 'rc-slider'
import React, { useMemo } from 'react'

export const CustomSlider = ({
  exposures,
  oldLeverage,
  newLeverage,
  marks,
  onChange
}: any) => {
  const [value, trackStyle, handleStyle] = useMemo(() => {
    const value = newLeverage <= oldLeverage ? [newLeverage, oldLeverage] : [oldLeverage, newLeverage]
    const trackStyle = { backgroundColor: newLeverage <= oldLeverage ? '#FF7A68' : '#4FBF67', height: '2px' }

    const handleStyle = newLeverage <= oldLeverage
      ? [
        { backgroundColor: 'white', borderColor: '#FF7A68' },
        { display: 'none' }
      ]
      : [
        { display: 'none' },
        { backgroundColor: 'white', borderColor: '#4FBF67' }
      ]

    return [value, trackStyle, handleStyle]
  }, [oldLeverage, newLeverage])

  return <Slider
    range
    min={Math.min(...exposures)}
    max={Math.max(...exposures)}
    step={0.1}
    defaultValue={[oldLeverage, newLeverage]}
    value={value}
    dotStyle={{
      background: '#303236',
      borderRadius: '2px',
      width: '1px',
      borderColor: '#303236',
      borderWidth: '1px',
      bottom: '-1px'
    }}
    activeDotStyle={{
      borderColor: '#03c3ff'
    }}
    marks={marks}
    trackStyle={trackStyle}
    handleStyle={handleStyle}
    railStyle={{ backgroundColor: '#303236', height: '2px' }}
    onChange={onChange}
  />
}
