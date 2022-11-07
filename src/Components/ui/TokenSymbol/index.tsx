import React, { useMemo } from 'react'
import { TokenType } from '../../../state/token/type'
import { useCurrentPool } from '../../../state/currentPool/hooks/useCurrentPool'
import { useListTokens } from '../../../state/token/hook'

export const TokenSymbol = ({ token }: {token: TokenType}) => {
  const { baseToken } = useCurrentPool()
  const { tokens } = useListTokens()
  const result = useMemo(() => {
    const symbol = token?.symbol
    if (symbol && symbol.includes('^') && symbol.split('^').length === 2) {
      const arr = symbol.split('^')
      return <React.Fragment><span className='font-size-14 upper-case'>{tokens[baseToken]?.symbol}</span><sup className='font-size-12'>{arr[1]}</sup></React.Fragment>
    }
    return <span className='font-size-18'>{symbol}</span>
  }, [token])

  return <React.Fragment>{result}</React.Fragment>
}
