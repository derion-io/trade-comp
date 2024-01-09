import React, { useState } from 'react'
import './style.scss'
export const CurrencyLogo = (props: {
  src?: string
  className?: string
  currencyURI?: string
  size?: number
}) => {
  const [url, setUrl] = useState(props.currencyURI?.replace('/thumb/', '/standard/'))
  return <img
    loading='lazy'
    onError={() => {
      setUrl(props.currencyURI)
    }}
    style={{
      width: props.size || 50,
      height: props.size || 50,
      borderRadius: '50%'
    }}
    {...props}
    src={url}
  />
}
