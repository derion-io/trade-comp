import React from 'react'
import './style.scss'

const defaultProps = {
  borderWidth: '1px',
  background: 'transparent'
}

export const Box = (
  props: React.HTMLAttributes<HTMLSpanElement> & {
    children: any
    background?: string
    borderColor?: 'default' | 'buy' | 'sell' | 'blue' | string
    borderWidth?: string | number
    borderRadius?: string
  }
) => {
  const propsWithDefault = {
    ...defaultProps,
    ...props
  }

  return (
    <div className='derivable-box__wrap'>
      {
        propsWithDefault.title &&
        <div className='derivable-box__title'>{propsWithDefault.title}</div>
      }

      <div
        {...propsWithDefault}
        className={`derivable-box ${propsWithDefault.className} ${propsWithDefault.borderColor ? ('border-' + propsWithDefault.borderColor) : ''} `}
        style={{
          ...propsWithDefault.style,
          background: propsWithDefault.background || 'transparent',
          borderRadius: propsWithDefault.borderRadius
        }}
      >
        {props.children}
      </div>
    </div>
  )
}
