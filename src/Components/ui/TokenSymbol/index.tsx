import React, { useMemo } from 'react'
import { useCurrentPoolGroup } from '../../../state/currentPool/hooks/useCurrentPoolGroup'
import { useListTokens } from '../../../state/token/hook'
import { decodeErc1155Address, getTokenPower, isErc1155Address } from '../../../utils/helpers'
import { useResource } from '../../../state/resources/hooks/useResource'
import { POOL_IDS } from '../../../utils/constant'
import { useHelper } from '../../../state/config/useHelper'
import { Text, TextBlue, TextBuy, TextPink, TextSell } from '../Text'

export const TokenSymbol = ({ token, textWrap }: { token: string, textWrap?: any }) => {
  const { baseToken } = useCurrentPoolGroup()
  const { tokens } = useListTokens()
  const { pools } = useResource()
  const { wrapToNativeAddress } = useHelper()

  const result = useMemo(() => {
    const symbol = tokens[token]?.symbol
    if (isErc1155Address(token)) {
      const { address: poolAddress, id } = decodeErc1155Address(token)
      const pool = pools[poolAddress]
      if (!pool) {
        return <span className='font-size-14'>{symbol}</span>
      }

      const TextComp = textWrap || (Number(id) === POOL_IDS.C
        ? TextBlue
        : Number(id) === POOL_IDS.A
          ? TextBuy
          : Number(id) === POOL_IDS.B
            ? TextSell
            : Text)

      return <TextComp>
        <span
          className='font-size-14'>{Number(id) === POOL_IDS.C && 'LP-'}{tokens[wrapToNativeAddress(baseToken)]?.symbol}</span>
        <sup className='font-size-12'>
          {Number(id) === POOL_IDS.C && '±'}{getTokenPower(pool.TOKEN_R, baseToken, Number(id), pool?.k.toNumber())}
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
