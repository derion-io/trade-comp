import React from 'react'
import './style.scss'

type TextType = React.HTMLAttributes<HTMLDivElement> & { title: any}

export const Divider = (props: TextType) => {
  return (
    <div
      {...props}
      className={'derivable-divider ' + props.className}
    >
      <div className='derivable-divider__line'/>
      <span className='derivable-divider__title'>
        {props.title}
      </span>
    </div>
  )
}
