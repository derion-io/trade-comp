import React from 'react'
import './style.scss'

export default (props: any) => {
  return (
    <div {...props} className={`card ${props.className}`}>
      {props.children}
    </div>
  )
}
