import React, { useEffect, useState } from 'react'
import { Text } from '../Text'
import './style.scss'

export const ToggleSwitch = ({
  label,
  defaultChecked,
  setter
}: {
  label: string
  defaultChecked: boolean
  setter: any
}) => {
  const [isShowBalanceToggled, setIsShowBalanceToggled] = useState<boolean>()
  useEffect(() => {
    setIsShowBalanceToggled(defaultChecked)
  }, [defaultChecked])

  const toggleHandler = () => {
    setIsShowBalanceToggled(!isShowBalanceToggled)
    setter(!isShowBalanceToggled)
  }
  return (
    <div className='toggle-container'>
      <Text>{label} </Text>
      <div className='toggle-switch'>
        <input
          type='checkbox'
          className='checkbox'
          defaultChecked={isShowBalanceToggled}
          name={label}
          id={label}
          onClick={toggleHandler}
        />
        <label className='label' htmlFor={label}>
          <span className='inner' />
          <span className='switch' />
        </label>
      </div>
    </div>
  )
}
