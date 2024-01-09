import React from 'react'
import './style.scss'
export const CurrencyLogo = (props: {
  src?: string
  className?: string
  currencyURI?: string
  size?: number
}) => {
  return <img
    style={{
      width: props.size || 50,
      height: props.size || 50,
      borderRadius: '50%'
    }}
    {...props}
    src={props.currencyURI}
  />
}
