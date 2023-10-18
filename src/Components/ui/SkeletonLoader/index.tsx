import React, { useRef } from 'react'
import './style.scss'
import { TextGrey } from '../Text'

export const SkeletonLoader = (
  props: React.HTMLAttributes<HTMLDivElement> & { height?: string; loading: boolean, textLoading?: string}
) => {
  const { loading, textLoading, height } = props
  const contentRef = useRef(null)
  return (
    <div
      style={{
        // @ts-ignore
        height: height || contentRef.current?.clientHeight || 18
      }}
      className={`skeleton-loader ${props.className}`}
      {...props}
    >
      {loading &&
       <div className='skeleton-loader__bone'
         style={{ height: height || (contentRef.current as any)?.clientHeight || 18 }}>
         <TextGrey>{textLoading || ''}</TextGrey>
       </div>}
      <div className={`${loading && 'content-hidden'}`} ref={contentRef}>
        {props.children}
      </div>
    </div>
  )
}
