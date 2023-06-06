import React, { useMemo } from 'react'
import { useCurrentPool } from '../../../state/currentPool/hooks/useCurrentPool'
import { useListTokens } from '../../../state/token/hook'
import { decodeErc1155Address, getTokenPower, isErc1155Address } from '../../../utils/helpers'
import { useListPool } from '../../../state/resources/hooks/useListPool'
import { POOL_IDS } from '../../../utils/constant'
import { useHelper } from '../../../state/config/useHelper'
import { Text, TextBlue, TextBuy, TextPink, TextSell } from '../Text'

export const TokenSymbol = ({ token }: { token: string }) => {
  const { baseToken } = useCurrentPool()
  const { tokens } = useListTokens()
  const { pools } = useListPool()
  const { wrapToNativeAddress } = useHelper()

  const result = useMemo(() => {
    const symbol = tokens[token]?.symbol
    if (isErc1155Address(token)) {
      const { address: poolAddress, id } = decodeErc1155Address(token)
      const pool = pools[poolAddress]
      if (!pool) {
        return <span className='font-size-14'>{symbol}</span>
      }

      const TextComp = Number(id) === POOL_IDS.C
        ? TextBlue
        : Number(id) === POOL_IDS.A
          ? TextBuy
          : Number(id) === POOL_IDS.B
            ? TextSell
            : Text

      return <TextComp>
        <span
          className='font-size-14'>{Number(id) === POOL_IDS.C && 'DLP-'}{tokens[wrapToNativeAddress(pool.TOKEN_R)]?.symbol}</span>
        <sup className='font-size-12'>
          {getTokenPower(pool.TOKEN_R, baseToken, Number(id), pool?.k.toNumber())}
        </sup>
        {
          (pool.TOKEN_R !== baseToken || Number(id) === POOL_IDS.C) &&
          <span className='font-size-14'>·{tokens[wrapToNativeAddress(pool.TOKEN_R)]?.symbol}</span>
        }
      </TextComp>
    }
    return <TextPink className='font-size-14'>{symbol}</TextPink>
  }, [tokens, token, pools])

  return <React.Fragment>{result}</React.Fragment>
}
