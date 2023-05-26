import React from 'react'
import './style.scss'

const defaultProps = {
  borderWidth: '1px',
  borderColor: 'transparent',
  background: 'transparent'
}

export const Box = (
  props: React.HTMLAttributes<HTMLSpanElement> & {
    children: any
    background?: string
    borderColor?: 'default' | 'buy' | 'sell' | string
    borderWidth?: string | number
    borderRadius?: string
    disableBorderLeft?: boolean
    disableBorderRight?: boolean
    disableBorderTop?: boolean
    disableBorderBottom?: boolean
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
          borderRadius: propsWithDefault.borderRadius,
          // borderColor: `${propsWithDefault.borderColor || 'transparent'}`,
          borderLeft: propsWithDefault.disableBorderLeft ? 'none' : `${propsWithDefault.borderWidth} solid`,
          borderRight: propsWithDefault.disableBorderRight ? 'none' : `${propsWithDefault.borderWidth} solid`,
          borderTop: propsWithDefault.disableBorderTop ? 'none' : `${propsWithDefault.borderWidth} solid`,
          borderBottom: propsWithDefault.disableBorderBottom ? 'none' : `${propsWithDefault.borderWidth} solid`
        }}
      >
        {props.children}
      </div>
    </div>
  )
}
