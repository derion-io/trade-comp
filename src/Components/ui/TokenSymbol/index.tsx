import React, { useMemo } from 'react'
import { useCurrentPool } from '../../../state/currentPool/hooks/useCurrentPool'
import { useListTokens } from '../../../state/token/hook'
import { decodeErc1155Address, isErc1155Address } from '../../../utils/helpers'
import { useListPool } from '../../../state/resources/hooks/useListPool'
import { useConfigs } from '../../../state/config/useConfigs'
import { POOL_IDS } from '../../../utils/constant'

export const TokenSymbol = ({ token }: { token: string }) => {
  const { baseToken } = useCurrentPool()
  const { tokens } = useListTokens()
  const { pools } = useListPool()
  const { configs } = useConfigs()

  const result = useMemo(() => {
    const symbol = tokens[token]?.symbol
    if (isErc1155Address(token)) {
      const { address: poolAddress, id } = decodeErc1155Address(token)
      let baseSymbol = tokens[baseToken]?.symbol ?? 'ETH'
      const pool = pools[poolAddress]
      if (!pool) {
        return <span className='font-size-14'>{symbol}</span>
      }
      if (configs.addresses.wrapToken === baseToken) {
        baseSymbol = baseSymbol.substring(1)
      }

      let tokenR = tokens[pool.TOKEN_R]?.symbol
      if (configs.addresses.wrapToken === pool.TOKEN_R) {
        tokenR = tokenR.substring(1)
      }

      return <React.Fragment>
        <span className='font-size-14'>{Number(id) === POOL_IDS.C && 'DLP-'}{baseSymbol}</span>
        <sup className='font-size-12'>{Number(id) === POOL_IDS.B && '-'}{pool?.k.toNumber() / 2}</sup>
        <span className='font-size-14'>.{tokenR}</span>
      </React.Fragment>
    }
    // else if (token?.address === cToken) {
    //   return <span className='font-size-14'>{symbol}_{tokens[baseToken]?.symbol}_{tokens[quoteToken]?.symbol}</span>
    // }
    return <span className='font-size-14'>{symbol}</span>
  }, [tokens, token, pools])

  return <React.Fragment>{result}</React.Fragment>
}
