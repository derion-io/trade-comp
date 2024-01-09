import React from 'react'
import { CurrencyLogo } from '../CurrencyLogo'
import './style.scss'
export const CurrencyGroupLogo = (props: {
  src?: string
  className?: string
  currencyURIs?: string[]
  size?: number
}) => {
  return (<div className='currency-group'>
    {props.currencyURIs?.map((uri, _) => {
      return (
        <img
          key={_}
          loading='lazy'
          className='currency-group__item'
          style={{
            width: props.size || 50,
            height: props.size || 50
            // ...(_ === 0 ? { marginLeft: 0 } : {})
          }}
          {...props}
          src={uri}
        />
      )
    })}
  </div>
  )
}
