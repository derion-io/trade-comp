import React from 'react'
import './style.scss'

export const Card = (
  props: React.HTMLAttributes<HTMLDivElement> & { children: any }
) => {
  return (
    <div {...props} className={`card ${props.className}`}>
      {props.children}
    </div>
  )
}
