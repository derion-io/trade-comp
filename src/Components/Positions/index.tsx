import React, { useMemo, useState } from 'react'
import './style.scss'
import { useCurrentPool } from '../../state/currentPool/hooks/useCurrentPool'
import { useWalletBalance } from '../../state/wallet/hooks/useBalances'
import { POOL_IDS } from '../../utils/constant'
import { shortenAddressString } from '../../utils/helpers'
import { useListTokens } from '../../state/token/hook'
import { PoolType } from '../../state/resources/type'
import { Button } from '../ui/Button'
import { formatWeiToDisplayNumber } from '../../utils/formatBalance'
import { BigNumber } from 'ethers'
import { Text, TextLink } from '../ui/Text'
import { useConfigs } from '../../state/config/useConfigs'
import { TokenIcon } from '../ui/TokenIcon'
import { TokenSymbol } from '../ui/TokenSymbol'
import { ClosePosition } from '../ClosePositionModal'

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
  const { configs } = useConfigs()

  const [visible, setVisible] = useState<boolean>(false)
  const [dToken, setDToken] = useState<string>('')
  const [inputTokenAddress, setInputTokenAddress] = useState<string>('')
  const [outputTokenAddress, setOutputTokenAddress] = useState<string>('')

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

    return result.filter((r: any) => r !== null)
  }, [balances, pools])

  return <div className='positions-table'>
    <table>
      <thead>
        <tr>
          <th>Pool</th>
          <th>Token</th>
          <th>Pair</th>
          <th>Leverage</th>
          <th>Reserve token</th>
          <th>Value</th>
          <th>Balance</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {
          (positions && positions.length > 0) && positions.map((position, key: number) => {
            return <tr key={key}>
              <td>
                <TextLink href={configs.explorer + '/address/' + position.poolAddress}>
                  {shortenAddressString(position.poolAddress)}
                </TextLink>
              </td>
              <td>
                <div className='d-flex gap-05 align-items-center'>
                  <TokenIcon size={24} tokenAddress={position.token} />
                  <span><TokenSymbol token={position.token} /></span>
                </div>
              </td>
              <td>
                <Text>{tokens[position.pool.baseToken]?.symbol}/{tokens[position.pool.quoteToken]?.symbol}</Text>
              </td>
              <td>X{position.pool.k.toNumber() / 2}</td>
              <td>
                <div className='d-flex gap-05 align-items-center'>
                  <TokenIcon size={24} tokenAddress={position.pool.TOKEN_R} />
                  <Text>{tokens[position.pool.TOKEN_R]?.symbol}</Text>
                </div>
              </td>
              <td>
                <Text>{formatWeiToDisplayNumber(position.balance, 4, tokens[position.token].decimals)}</Text>
              </td>
              <td>
                <Text>{formatWeiToDisplayNumber(position.balance, 4, tokens[position.token].decimals)}</Text>
              </td>
              <td className='text-right'>
                <Button
                  size='small'
                  onClick={() => {
                    setInputTokenAddress(position.token)
                    setOutputTokenAddress(position.pool.TOKEN_R)
                    setVisible(true)
                  }}
                >Close</Button>
              </td>
            </tr>
          })
        }
      </tbody>
    </table>

    <ClosePosition
      visible={visible}
      setVisible={setVisible}
      inputTokenAddress={inputTokenAddress}
      outputTokenAddress={outputTokenAddress}
    />
  </div>
}
