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
    borderColor?: string
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
        className={'derivable-box ' + propsWithDefault.className}
        style={{
          ...propsWithDefault.style,
          background: propsWithDefault.background || 'transparent',
          borderRadius: propsWithDefault.borderRadius,
          borderLeft: propsWithDefault.disableBorderLeft ? 'none' : `${propsWithDefault.borderWidth} solid ${propsWithDefault.borderColor || 'transparent'}`,
          borderRight: propsWithDefault.disableBorderRight ? 'none' : `${propsWithDefault.borderWidth} solid ${propsWithDefault.borderColor || 'transparent'}`,
          borderTop: propsWithDefault.disableBorderTop ? 'none' : `${propsWithDefault.borderWidth} solid ${propsWithDefault.borderColor || 'transparent'}`,
          borderBottom: propsWithDefault.disableBorderBottom ? 'none' : `${propsWithDefault.borderWidth} solid ${propsWithDefault.borderColor || 'transparent'}`,
        }}
      >
        {props.children}
      </div>
    </div>
  )
}
