import React from 'react'
import './style.scss'

export const Box = (
  props: React.HTMLAttributes<HTMLSpanElement> & {
    children: any
    background?: string
    borderColor?: string
  }
) => {
  return (
    <div className='derivable-box__wrap'>
      {
        props.title &&
        <div className='derivable-box__title'>{props.title}</div>
      }

      <div
        {...props}
        className={'derivable-box ' + props.className}
        style={{
          ...props.style,
          background: props.background || 'transparent',
          border: `1px solid ${props.borderColor || 'transparent'}`
        }}
      >
        {props.children}
      </div>
    </div>
  )
}
