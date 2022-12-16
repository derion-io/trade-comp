import React, { Fragment, useMemo } from 'react'
import { TokenType } from '../../../state/token/type'
import { useCurrentPool } from '../../../state/currentPool/hooks/useCurrentPool'
import { useListTokens } from '../../../state/token/hook'
import { TextBuy, TextSell } from '../Text'

export const TokenSymbol = ({ token }: {token: TokenType}) => {
  const { baseToken, cToken, quoteToken } = useCurrentPool()
  const { tokens } = useListTokens()
  const result = useMemo(() => {
    const symbol = token?.symbol
    if (symbol && symbol.includes('^') && symbol.split('^').length === 2) {
      const arr = symbol.split('^')
      const power = arr[1]
      let baseSymbol = tokens[baseToken]?.symbol ?? 'BNB'
      if (baseSymbol.startsWith('W')) {
        baseSymbol = baseSymbol.substring(1)
      }
      return <React.Fragment>
        <span className='font-size-14 upper-case'>{baseSymbol}</span>
        <sup className='font-size-12'>{power}</sup>
      </React.Fragment>
    }
    // else if (token?.address === cToken) {
    //   return <span className='font-size-14'>{symbol}_{tokens[baseToken]?.symbol}_{tokens[quoteToken]?.symbol}</span>
    // }
    return <span className='font-size-14'>{symbol}</span>
  }, [token, baseToken])

  return <React.Fragment>{result}</React.Fragment>
}
