import cx from 'classnames'
import React, { useCallback, useState, useRef } from 'react'
import './style.scss'

const OPEN_DELAY = 0
const CLOSE_DELAY = 100
const IS_TOUCH = 'ontouchstart' in window
type Props = {
  handle: React.ReactNode;
  renderContent: () => React.ReactNode;
  position?: string;
  trigger?: string;
  className?: string;
  disableHandleStyle?: boolean;
  handleClassName?: string;
  isHandlerDisabled?: boolean;
};

export default function Tooltip(props: Props) {
  const [visible, setVisible] = useState(false)
  const intervalCloseRef = useRef<ReturnType<typeof setTimeout> | null>()
  const intervalOpenRef = useRef<ReturnType<typeof setTimeout> | null>()

  const position = props.position ?? 'left-bottom'
  const trigger = props.trigger ?? 'hover'

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
    <span className={className} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} onClick={onMouseClick}>
      <span
        className={cx({ 'tooltip-handle': !props.disableHandleStyle }, [props.handleClassName], { active: visible })}
      >
        {props.isHandlerDisabled ? <div className='tooltip-disabled-wrapper'>{props.handle}</div> : <div>{props.handle}</div>}
      </span>
      {visible && <div className={cx(['tooltip-popup', position])}>{props.renderContent()}</div>}
    </span>
  )
}

export function TooltipThematicBreak () {
  return <hr className='tooltip-thematic-break'/>
}
