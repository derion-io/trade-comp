import React from 'react'
import './style.scss'

export const Label = (
  props: React.HTMLAttributes<HTMLSpanElement> & {
    children: any
    background?: string
  }
) => {
  return (
    <div
      {...props}
      className={'derivable-label ' + props.className}
      style={{ ...props.style, background: props.background || 'transparent' }}
    >
      {props.children}
    </div>
  )
}
