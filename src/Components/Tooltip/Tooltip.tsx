import cx from 'classnames'
import React, { useCallback, useState, useRef, useEffect } from 'react'
import './style.scss'

const OPEN_DELAY = 0
const CLOSE_DELAY = 100
const IS_TOUCH = 'ontouchstart' in window
type Props = {
  handle: React.ReactNode
  renderContent: () => React.ReactNode
  position?: string
  trigger?: string
  className?: string
  disableHandleStyle?: boolean
  handleClassName?: string
  isHandlerDisabled?: boolean
  wrappedStyle?: any
  externalTrigger?: boolean
  setExternalTrigger?: (et: boolean) => void;
}

export default function Tooltip(props: Props) {
  const [visible, setVisible] = useState(false)
  const intervalCloseRef = useRef<ReturnType<typeof setTimeout> | null>()
  const intervalOpenRef = useRef<ReturnType<typeof setTimeout> | null>()

  const position = props.position ?? 'left-bottom'
  const trigger = props.trigger ?? 'hover'
  useEffect(() => {
    if (props.externalTrigger !== undefined) {
      if (props.externalTrigger) setVisible(true)
      else setVisible(false)
    }
  }, [props.externalTrigger])

  useEffect(() => {
    if (props.externalTrigger !== undefined && props.setExternalTrigger) props.setExternalTrigger(visible)
  }, [visible])
  const onMouseEnter = useCallback(() => {
    if (trigger !== 'hover' || IS_TOUCH) return
    if (intervalCloseRef.current) {
      clearInterval(intervalCloseRef.current)
      intervalCloseRef.current = null
    }
    if (!intervalOpenRef.current) {
      intervalOpenRef.current = setTimeout(() => {
        setVisible(true)
        intervalOpenRef.current = null
      }, OPEN_DELAY)
    }
  }, [setVisible, intervalCloseRef, intervalOpenRef, trigger])

  const onMouseClick = useCallback(() => {
    if (trigger !== 'click' && !IS_TOUCH) return
    if (intervalCloseRef.current) {
      clearInterval(intervalCloseRef.current)
      intervalCloseRef.current = null
    }
    if (intervalOpenRef.current) {
      clearInterval(intervalOpenRef.current)
      intervalOpenRef.current = null
    }
    setVisible(true)
  }, [setVisible, intervalCloseRef, trigger])

  const onMouseLeave = useCallback(() => {
    intervalCloseRef.current = setTimeout(() => {
      setVisible(false)
      intervalCloseRef.current = null
    }, CLOSE_DELAY)
    if (intervalOpenRef.current) {
      clearInterval(intervalOpenRef.current)
      intervalOpenRef.current = null
    }
  }, [setVisible, intervalCloseRef])

  const className = cx('tooltip', props.className)
  return (
    <span
      style={...props.wrappedStyle}
      className={className}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onMouseClick}
    >
      <span
        className={cx(
          { 'tooltip-handle': !props.disableHandleStyle },
          [props.handleClassName],
          { active: visible }
        )}
        style={...props.wrappedStyle}
      >
        {props.isHandlerDisabled ? (
          <div className='tooltip-disabled-wrapper'>{props.handle}</div>
        ) : (
          <div style={...props.wrappedStyle}>{props.handle}</div>
        )}
      </span>
      {visible && (
        <div className={cx(['tooltip-popup', position])}>
          {props.renderContent()}
        </div>
      )}
    </span>
  )
}
