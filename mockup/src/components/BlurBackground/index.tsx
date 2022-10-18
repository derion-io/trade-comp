import React, {useEffect, useRef, useState} from 'react'
import './style.scss'
import {useWindowSize} from "../../hooks/useWindowSize";

const colors = ['#01A7FA', '#FFF2BF']

export const BlurBackground = ({ pointNumber, children }: { pointNumber: number, children: any }) => {
  const {width} = useWindowSize()
  const bgRef = useRef<any>(null)
  const [pointElements, setPointElements] = useState<any>([])
  const isPhone = width && width < 768

  useEffect(() => {
    const maxHeight = bgRef.current.clientHeight
    const maxWidth = bgRef.current.clientWidth
    const minSize = isPhone ? 30 : 50
    const maxSize = isPhone ? 75 : 150
    const minBlur = isPhone ? 30 : 50
    const maxBlur = isPhone ? 60 : 120

    const result = []
    for (let i = 1; i <= pointNumber; i++) {
      const size = Math.floor(Math.random() * maxSize) + minSize
      const maxH = Math.floor(maxHeight * 3 / pointNumber) * Math.ceil(i / 3)
      const minH = Math.floor(maxHeight * 3 / pointNumber) * Math.floor(i / 3)
      const style = {
        width: `${size}px`,
        height: `${size}px`,
        filter: `blur(${Math.floor(Math.random() * maxBlur) + minBlur}px)`,
        left: `${Math.floor(Math.random() * maxWidth)}px`,
        top: `${Math.floor(Math.random() * maxH) + 100 + minH}px`,
        background: colors[Math.floor(Math.random() * 2)]
      }
      result.push(<span className='blur-point' style={style}>
      </span>)
    }
    setPointElements(result)
  }, [bgRef, width])

  return (<div className='blur-background' ref={bgRef}>
    {pointElements}
    <div className='blur-background__content'>
      {children}
    </div>
  </div>)
}
