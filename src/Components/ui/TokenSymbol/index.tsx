import React, { useMemo } from 'react'
import { useListTokens } from '../../../state/token/hook'
import {
  decodeErc1155Address,
  getPoolPower,
  isErc1155Address,
  isUSD
} from '../../../utils/helpers'
import { useResource } from '../../../state/resources/hooks/useResource'
import { POOL_IDS } from '../../../utils/constant'
import { useHelper } from '../../../state/config/useHelper'
import { Text, TextBlue, TextBuy, TextPink, TextSell } from '../Text'

type Props = {
  token: string
  textWrap?: any
  className?: string,
  color?: string
  hideSymbol?: boolean,
}
export const TokenSymbol = ({
  token,
  textWrap,
  className,
  color,
  hideSymbol
}: Props) => {
  const { tokens } = useListTokens()
  const { pools } = useResource()
  const { wrapToNativeAddress } = useHelper()

  const result = useMemo(() => {
    if (!pools) return ''
    const symbol = tokens[token]?.symbol
    if (isErc1155Address(token)) {
      const { address: poolAddress, id } = decodeErc1155Address(token)
      const pool = pools[poolAddress]
      if (!pool) {
        return <span className='font-size-14'>{symbol}</span>
      }

      const { baseToken, quoteToken, TOKEN_R, k } = pool

      const TextComp =
        textWrap ||
        (Number(id) === POOL_IDS.C
          ? TextBlue
          : Number(id) === POOL_IDS.A
            ? TextBuy
            : Number(id) === POOL_IDS.B
              ? TextSell
              : Text)

      const side =
        Number(id) === POOL_IDS.A
          ? 'Long'
          : Number(id) === POOL_IDS.B
            ? 'Short'
            : 'Liquidity'
      const power = getPoolPower(pool)
      const base = tokens[wrapToNativeAddress(baseToken)]?.symbol
      const quote = tokens[wrapToNativeAddress(quoteToken)]?.symbol
      const indexPrefix = isUSD(quote ?? '') ? '' : `/${quote}`

      return (
        <TextComp className={className}>
          {side} {power}x {base}
          {indexPrefix}
        </TextComp>
      )

      // return <TextComp>
      //   <span
      //     className='font-size-14'>{Number(id) === POOL_IDS.C && 'LP-'}{tokens[wrapToNativeAddress(baseToken)]?.symbol}</span>
      //   <sup className='font-size-12'>
      //     {Number(id) === POOL_IDS.C && '±'}{getPoolPower(pool.TOKEN_R, baseToken, Number(id), pool?.k.toNumber())}
      //   </sup>
      //   {
      //     (pool.TOKEN_R !== baseToken || Number(id) === POOL_IDS.C) &&
      //     <span className='font-size-14'>·{tokens[wrapToNativeAddress(pool.TOKEN_R)]?.symbol}</span>
      //   }s
      // </TextComp>
    }
    return color ? <Text className={className}>{symbol}</Text> : <TextPink className={className}> {symbol}</TextPink>
  }, [tokens, token, pools])

  return <React.Fragment>{result}</React.Fragment>
}
