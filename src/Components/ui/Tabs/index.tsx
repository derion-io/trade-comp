import React, { useEffect, useRef, useState } from 'react'
import './style.scss'
import { Button } from '../Button'
import { useWindowSize } from '../../../hooks/useWindowSize'

interface TabProps extends React.HTMLAttributes<HTMLDivElement> {
  tabs: any
  setTab: any
  tab: any
}

export const Tabs = (props: TabProps) => {
  const setTab = props.setTab
  const currentTab = props.tab
  const tabs = props.tabs
  const ref = useRef<any>()
  const [sliderStyle, setSliderStyle] = useState<any>({})
  const { width } = useWindowSize()

  useEffect(() => {
    const a = document.querySelectorAll('.derivable-tabs__item.active')
    const itemPosition = a[0].getBoundingClientRect()
    setSliderStyle({
      left: itemPosition.x,
      width: itemPosition.width,
      height: itemPosition.height
    })
  }, [currentTab, width])

  return (
    <React.Fragment>
      <div className='derivable-tabs__slider' style={sliderStyle} />
      <div className={`derivable-tabs ${props.className}`} ref={ref}>
        {tabs.map((tab: any, key: number) => {
          return (
            <span
              key={key}
              className={`derivable-tabs__item ${
                currentTab === tab.value ? 'active' : ''
              }`}
              onClick={() => setTab(tab.value)}
            >
              <span>{tab.name}</span>
            </span>
          )
        })}
      </div>
    </React.Fragment>
  )
}
