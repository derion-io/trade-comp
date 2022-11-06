import React from "react"
import { TokenType } from '../../../state/token/type'
import { useMemo } from 'react'

export const TokenSymbol = ({ token }: {token: TokenType}) => {
  const result = useMemo(() => {
    const symbol = token?.symbol
    if (symbol && symbol.includes('^') && symbol.split('^').length === 2) {
      const arr = symbol.split('^')
      return <React.Fragment><span className='font-size-18 upper-case'>{arr[0]}</span><sup className='font-size-14'>{arr[1]}</sup></React.Fragment>
    }
    return <span className='font-size-18'>{symbol}</span>
  }, [token])

  return <React.Fragment>{result}</React.Fragment>
}
