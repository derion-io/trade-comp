import React, { useMemo, useState } from 'react'
import './style.scss'
import { useCurrentPool } from '../../state/currentPool/hooks/useCurrentPool'
import { useWalletBalance } from '../../state/wallet/hooks/useBalances'
import { POOL_IDS } from '../../utils/constant'
import { formatFloat, shortenAddressString, weiToNumber } from '../../utils/helpers'
import { useListTokens } from '../../state/token/hook'
import { PoolType } from '../../state/resources/type'
import { Button } from '../ui/Button'
import formatLocalisedCompactNumber, { formatWeiToDisplayNumber } from '../../utils/formatBalance'
import { BigNumber } from 'ethers'
import { Text, TextLink } from '../ui/Text'
import { useConfigs } from '../../state/config/useConfigs'
import { TokenIcon } from '../ui/TokenIcon'
import { TokenSymbol } from '../ui/TokenSymbol'
import { ClosePosition } from '../ClosePositionModal'
import { useTokenValue } from '../SwapBox/hooks/useTokenValue'
import { useHelper } from '../../state/config/useHelper'

const MIN_POSITON_VALUE_TO_DISPLAY = 0.0001

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
  const { getTokenValue } = useTokenValue({})
  const { wrapToNativeAddress } = useHelper()

  const [visible, setVisible] = useState<boolean>(false)
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
          <th className='hidden-on-phone'>Pool</th>
          <th>Token</th>
          <th className='hidden-on-phone'>Pair</th>
          <th className='hidden-on-phone'>Leverage</th>
          <th className='hidden-on-phone'>Reserve token</th>
          <th>Balance</th>
          <th>Value</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {
          (positions && positions.length > 0) && positions.map((position, key: number) => {
            const value = getTokenValue(
              position.token,
              weiToNumber(position.balance, tokens[position.token]?.decimal || 18)
            )
            if (Number(value) < MIN_POSITON_VALUE_TO_DISPLAY) {
              return ''
            }

            return <tr key={key}>
              <td className='hidden-on-phone'>
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
              <td className='hidden-on-phone'>
                <Text>{tokens[position.pool.baseToken]?.symbol}/{tokens[position.pool.quoteToken]?.symbol}</Text>
              </td>
              <td className='hidden-on-phone'>x{position.pool.k.toNumber() / 2}</td>
              <td className='hidden-on-phone'>
                <div className='d-flex gap-05 align-items-center'>
                  <TokenIcon size={24} tokenAddress={position.pool.TOKEN_R} />
                  <Text>{tokens[position.pool.TOKEN_R]?.symbol}</Text>
                </div>
              </td>
              <td>
                <Text>{formatWeiToDisplayNumber(position.balance, 4, tokens[position.token].decimals)}</Text>
              </td>
              <td>
                <Text>${formatLocalisedCompactNumber(formatFloat(value))}</Text>
              </td>
              <td className='text-right'>
                <Button
                  size='small'
                  onClick={() => {
                    setInputTokenAddress(position.token)
                    setOutputTokenAddress(wrapToNativeAddress(position.pool.TOKEN_R))
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
