import React, { useMemo } from 'react'
import './style.scss'
import { useCurrentPool } from '../../state/currentPool/hooks/useCurrentPool'
import { useWalletBalance } from '../../state/wallet/hooks/useBalances'
import { POOL_IDS } from '../../utils/constant'
import { shortenAddressString, weiToNumber } from '../../utils/helpers'
import { useListTokens } from '../../state/token/hook'
import { PoolType } from '../../state/resources/type'
import { Button } from '../ui/Button'
import { formatWeiToDisplayNumber } from '../../utils/formatBalance'
import { BigNumber } from 'ethers'

type Position = {
  poolAddress: string
  token: string
  pool: PoolType
  balance: BigNumber
  netValue: BigNumber
}

export const Positions = () => {
  const { pools } = useCurrentPool()
  const { balances } = useWalletBalance()
  const { tokens } = useListTokens()

  const generatePositionData = (poolAddress: string, poolId: number): Position | null => {
    if (balances[poolAddress + '-' + poolId] && balances[poolAddress + '-' + poolId].gt(0)) {
      return {
        poolAddress,
        pool: pools[poolAddress],
        token: poolAddress + '-' + poolId,
        balance: balances[poolAddress + '-' + poolId],
        netValue: balances[poolAddress + '-' + poolId]
      }
    }
    return null
  }

  const positions: Position[] = useMemo(() => {
    const result: any = []
    Object.keys(pools).forEach((poolAddress) => {
      result.push(generatePositionData(poolAddress, POOL_IDS.A))
      result.push(generatePositionData(poolAddress, POOL_IDS.B))
    })

    console.log(result)
    return result.filter((r: any) => r !== null)
  }, [balances, pools])

  return <div>
    <table>
      <thead>
        <tr>
          <th>Pool</th>
          <th>Leverage</th>
          <th>Reserve token</th>
          <th>Token pair</th>
          <th>Value</th>
          <th>Balance</th>
          <th/>
        </tr>
      </thead>
      <tbody>
        {
          (positions && positions.length > 0) && positions.map((position, key: number) => {
            return <tr key={key}>
              <td>
                {shortenAddressString(position.poolAddress)}
              </td>
              <td>X{position.pool.k.toNumber()}</td>
              <td>{tokens[position.pool.TOKEN_R]?.symbol}</td>
              <td>
                {tokens[position.pool.baseToken]?.symbol}/{tokens[position.pool.quoteToken]?.symbol}
              </td>
              <td>{formatWeiToDisplayNumber(position.balance, 4, tokens[position.token].decimals)}</td>
              <td><Button>Close</Button></td>
            </tr>
          })
        }
      </tbody>
    </table>
  </div>
}
