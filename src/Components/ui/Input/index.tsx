import React from 'react'
import './style.scss'

type InputType = React.HTMLAttributes<HTMLInputElement> & {
  inputWrapProps?: React.HTMLAttributes<HTMLDivElement>
  prefix?: any
  suffix?: any
}

export const Input = (props: InputType) => {
  return (
    <div
      {...props.inputWrapProps}
      className={`derivable-input-wrap ${props.inputWrapProps?.className} `}
    >
      {props.prefix && (
        <div className='derivable-input__prefix'>{props.prefix}</div>
      )}
      <input
        type='text'
        {...props}
        className={`derivable-input ${props.className} `}
      />
      {props.suffix && (
        <div className='derivable-input__suffix'>{props.suffix}</div>
      )}
    </div>
  )
}
