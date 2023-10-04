import React, { ChangeEvent, useState } from 'react'
import './style.scss'

function escapeSpecialRegExpChars(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const inputRegex = RegExp('^\\d*(?:\\\\[.])?\\d*$')

type Props = {
  value?: string | number;
  inputRef?: React.RefObject<HTMLInputElement>;
  onValueChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  className?: string;
  placeholder?: string;
  inputWrapProps?: React.HTMLAttributes<HTMLDivElement>;
  prefix?: any;
  suffix?: any;
};

const NumberInput: React.FC<Props> = ({
  value,
  inputRef,
  onValueChange,
  onFocus,
  onBlur,
  className,
  placeholder,
  inputWrapProps,
  suffix,
  prefix
}: Props) => {
  const [isFocusing, setIsFocusing] = useState<boolean>(false)
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!onValueChange) return
    let newValue = e.target.value.replace(/,/g, '.')
    if (newValue === '.') {
      newValue = '0.'
    }

    if (newValue === '' || inputRegex.test(escapeSpecialRegExpChars(newValue))) {
      e.target.value = newValue
      onValueChange(e)
    }
  }

  return (
    <div
      {...inputWrapProps}
      className={`derivable-input-wrap ${isFocusing && 'focus'} ${
      inputWrapProps?.className
    } `}
    >
      {prefix && (
        <div className='derivable-input__prefix'>{prefix}</div>
      )}
      <input
        type='text'
        inputMode='decimal'
        placeholder={placeholder}
        className={`derivable-input ${className}`}
        value={value}
        ref={inputRef}
        onChange={onChange}
        autoComplete='off'
        autoCorrect='off'
        spellCheck='false'
        onFocus={(e) => {
          setIsFocusing(true)
          if (onFocus) {
            onFocus()
          }
        }}
        onBlur={(e) => {
          setIsFocusing(false)
          if (onBlur) {
            onBlur()
          }
        }}
      />
      {suffix && (
        <div className='derivable-input__suffix'>{suffix}</div>
      )}
    </div>
  )
}

export default NumberInput
