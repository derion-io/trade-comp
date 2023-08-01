import React, { useMemo, useState } from 'react'
import './style.scss'
import { useCurrentPoolGroup } from '../../state/currentPool/hooks/useCurrentPoolGroup'
import { useWalletBalance } from '../../state/wallet/hooks/useBalances'
import { POOL_IDS, TRADE_TYPE } from '../../utils/constant'
import {
  decodeErc1155Address, div,
  formatFloat, formatPercent,
  max,
  numberToWei,
  shortenAddressString, sub,
  weiToNumber
} from '../../utils/helpers'
import { useListTokens } from '../../state/token/hook'
import { PoolType } from '../../state/resources/type'
import { ButtonSell } from '../ui/Button'
import formatLocalisedCompactNumber, { formatWeiToDisplayNumber } from '../../utils/formatBalance'
import { BigNumber } from 'ethers'
import { Text, TextBuy, TextLink, TextSell } from '../ui/Text'
import { useConfigs } from '../../state/config/useConfigs'
import { TokenIcon } from '../ui/TokenIcon'
import { TokenSymbol } from '../ui/TokenSymbol'
import { ClosePosition } from '../ClosePositionModal'
import { useTokenValue } from '../SwapBox/hooks/useTokenValue'
import { useHelper } from '../../state/config/useHelper'
import { useSettings } from '../../state/setting/hooks/useSettings'
import { useSwapHistory } from '../../state/wallet/hooks/useSwapHistory'
import _ from 'lodash'
import { Cowntdown } from '../ui/CountDown'
import { useWindowSize } from '../../hooks/useWindowSize'

const MIN_POSITON_VALUE_TO_DISPLAY = 0.0001

type Position = {
  poolAddress: string
  token: string
  pool: PoolType
  poolId: number
  balance: BigNumber
  netValue: string
  maturity: number
}

export const Positions = ({ setOutputTokenAddressToBuy, tokenOutMaturity }: { setOutputTokenAddressToBuy: any, tokenOutMaturity: BigNumber }) => {
  const { pools, tradeType } = useCurrentPoolGroup()
  const { balances, maturities } = useWalletBalance()
  const { tokens } = useListTokens()
  const { configs, chainId } = useConfigs()
  const { getTokenValue } = useTokenValue({})
  const { wrapToNativeAddress } = useHelper()
  const { settings } = useSettings()

  const [visible, setVisible] = useState<boolean>(false)
  const [inputTokenAddress, setInputTokenAddress] = useState<string>('')
  const [outputTokenAddress, setOutputTokenAddress] = useState<string>('')
  const { ddlEngine } = useConfigs()
  const { id } = useCurrentPoolGroup()
  const { swapLogs: sls } = useSwapHistory()
  const { width } = useWindowSize()
  const isPhone = width && width < 992

  const positionsWithEntry = useMemo(() => {
    if (Object.values(pools).length > 0 && ddlEngine?.CURRENT_POOL.pools && id) {
      return ddlEngine?.HISTORY.generatePositions({
        tokens: Object.values(tokens),
        logs: _.cloneDeep(sls)
      })
    }
    return {}
  }, [sls, pools, ddlEngine?.CURRENT_POOL, id, tokens])

  const generatePositionData = (poolAddress: string, poolId: number): Position | null => {
    if (balances[poolAddress + '-' + poolId] && balances[poolAddress + '-' + poolId].gt(0)) {
      const positionEntry = positionsWithEntry[poolAddress + '-' + poolId]

      return {
        poolAddress,
        pool: pools[poolAddress],
        token: poolAddress + '-' + poolId,
        poolId,
        balance: balances[poolAddress + '-' + poolId],
        netValue: positionEntry?.entry || 0,
        maturity: max(maturities[poolAddress + '-' + poolId]?.toNumber() - Math.floor(new Date().getTime() / 1000), 0)
      }
    }
    return null
  }

  const positions: Position[] = useMemo(() => {
    const result: any = []
    Object.keys(pools).forEach((poolAddress) => {
      result.push(generatePositionData(poolAddress, POOL_IDS.A))
      result.push(generatePositionData(poolAddress, POOL_IDS.B))
      result.push(generatePositionData(poolAddress, POOL_IDS.C))
    })

    return result.filter((r: any) => r !== null)
  }, [positionsWithEntry, balances, maturities, pools])

  const displayPositions = useMemo(() => {
    if (positions && positions.length > 0) {
      return positions.filter((p) => {
        if (tradeType === TRADE_TYPE.LIQUIDITY) {
          return p.poolId === POOL_IDS.C
        }
        if (tradeType === TRADE_TYPE.LONG || tradeType === TRADE_TYPE.SHORT) {
          return p.poolId === POOL_IDS.A || p.poolId === POOL_IDS.B
        }
        return true
      })
    }
    return []
  }, [positions, tradeType])

  const showSize = tradeType !== TRADE_TYPE.LIQUIDITY

  return <div className='positions-table'>
    {
      isPhone
        ? <div />
        : <table>
          <thead>
            <tr>
              <th className='hidden-on-phone'>Pool</th>
              <th>Token</th>
              <th>Net value</th>
              <th className='hidden-on-phone'>Maturity</th>
              <th className='hidden-on-phone'>Reserve</th>
              {settings.showBalance &&
            <th>Balance</th>
              }
              <th>Value</th>
              {showSize &&
            <th>Size</th>
              }
              <th />
            </tr>
          </thead>
          <tbody>
            {
              displayPositions.map((position, key: number) => {
                const value = getTokenValue(
                  position.token,
                  weiToNumber(position.balance, tokens[position.token]?.decimal || 18)
                )
                if (Number(value) < MIN_POSITON_VALUE_TO_DISPLAY && chainId !== 1337) {
                  return ''
                }
                const sizeDisplay = (position.poolId === POOL_IDS.A || position.poolId === POOL_IDS.B)
                  ? '$' + formatLocalisedCompactNumber(formatFloat(Number(value) * position.pool.k.toNumber() / 2)) : ''

                const pnl = position.netValue && value ? Number(div(sub(position.netValue, value), value)) : 0

                return <tr
                  className='position-row'
                  onClick={() => {
                    setOutputTokenAddressToBuy(position.token)
                  }}
                  key={key}
                >
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
                  <td>
                    {
                      position.netValue ? <div className='net-value-and-pnl'>
                        <Text>${formatLocalisedCompactNumber(formatFloat(position.netValue))}</Text>
                        {
                          pnl >= 0
                            ? <TextBuy>{formatPercent(pnl, 2)}%</TextBuy>
                            : <TextSell>{formatPercent(pnl, 2)}%</TextSell>
                        }
                      </div>
                        : '---'
                    }
                  </td>
                  <td>
                    {position.maturity
                      ? <Text>
                        <Cowntdown
                          second={position.maturity}
                        /> (s)
                      </Text>
                      : '---'
                    }
                  </td>
                  <td className='hidden-on-phone'>
                    <div className='d-flex gap-05 align-items-center'>
                      <TokenIcon size={24} tokenAddress={position.pool.TOKEN_R} />
                      <Text>{tokens[position.pool.TOKEN_R]?.symbol}</Text>
                    </div>
                  </td>
                  {settings.showBalance &&
                <td>
                  <Text>{formatWeiToDisplayNumber(position.balance, 4, tokens[position.token].decimals)}</Text>
                </td>
                  }
                  <td>
                    <Text>${formatLocalisedCompactNumber(formatFloat(value))}</Text>
                  </td>
                  {showSize &&
                <td><Text>{sizeDisplay}</Text></td>
                  }
                  <td className='text-right'>
                    <ButtonSell
                      size='small'
                      onClick={() => {
                        setInputTokenAddress(position.token)
                        setOutputTokenAddress(wrapToNativeAddress(position.pool.TOKEN_R))
                        setVisible(true)
                      }}
                    >{position.poolId === POOL_IDS.C ? 'Remove' : 'Close'}</ButtonSell>
                  </td>
                </tr>
              })
            }
          </tbody>
        </table>
    }
    <ClosePosition
      visible={visible}
      setVisible={setVisible}
      inputTokenAddress={inputTokenAddress}
      outputTokenAddress={outputTokenAddress}
      tokenOutMaturity={tokenOutMaturity}
      title={
        Number(decodeErc1155Address(inputTokenAddress).id) === POOL_IDS.C
          ? <Text>Remove <TokenSymbol token={inputTokenAddress} textWrap={Text} /> </Text>
          : <Text>Close <TokenSymbol token={inputTokenAddress} textWrap={Text} /> </Text>
      }
    />
  </div>
}
