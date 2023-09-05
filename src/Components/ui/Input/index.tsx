import React, { useState } from 'react'
import './style.scss'
import { InputProps } from 'reactstrap'

type InputType = InputProps & {
  inputWrapProps?: React.HTMLAttributes<HTMLDivElement>
  prefix?: any
  suffix?: any
  isNumber?: boolean
}

export const Input = (props: InputType) => {
  const isNumber = props?.isNumber || false
  const inputProps = isNumber
    ? {
        type: 'number',
        pattern: '[0-9]*',
        inputMode: 'decimal' as const
      }
    : {}
  const [isFocusing, setIsFocusing] = useState<boolean>(false)
  return (
    <div
      {...props.inputWrapProps}
      className={`derivable-input-wrap ${isFocusing && 'focus'} ${
        props.inputWrapProps?.className
      } `}
    >
      {props.prefix && (
        <div className='derivable-input__prefix'>{props.prefix}</div>
      )}
      <input
        {...inputProps}
        {...props}
        onFocus={(e) => {
          setIsFocusing(true)
          if (props.onFocus) {
            props.onFocus(e)
          }
        }}
        onBlur={(e) => {
          setIsFocusing(false)
          if (props.onBlur) {
            props.onBlur(e)
          }
        }}
        className={`derivable-input ${props.className} `}
      />
      {props.suffix && (
        <div className='derivable-input__suffix'>{props.suffix}</div>
      )}
    </div>
  )
}
