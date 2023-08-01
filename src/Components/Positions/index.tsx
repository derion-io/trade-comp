import React, { useMemo, useState } from 'react'
import './style.scss'
import { useCurrentPoolGroup } from '../../state/currentPool/hooks/useCurrentPoolGroup'
import { useWalletBalance } from '../../state/wallet/hooks/useBalances'
import { MIN_POSITON_VALUE_TO_DISPLAY, POOL_IDS, TRADE_TYPE } from '../../utils/constant'
import {
  decodeErc1155Address, div,
  formatFloat, formatPercent,
  max,
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
import { InfoRow } from '../ui/InfoRow'

type Position = {
  poolAddress: string
  token: string
  pool: PoolType
  poolId: number
  balance: BigNumber
  entryValue: string
  maturity: number
  sizeDisplay: string
  value: string
}

export const Positions = ({ setOutputTokenAddressToBuy, tokenOutMaturity }: { setOutputTokenAddressToBuy: any, tokenOutMaturity: BigNumber }) => {
  const { pools, tradeType } = useCurrentPoolGroup()
  const { balances, maturities } = useWalletBalance()
  const { tokens } = useListTokens()
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
    const token = poolAddress + '-' + poolId

    if (balances[token] && balances[token].gt(0)) {
      const positionEntry = positionsWithEntry[token]
      const entryValue = positionEntry?.entry ?? 0
      const value = getTokenValue(
        token,
        weiToNumber(balances[token], tokens[token]?.decimal || 18)
      )
      if (Number(value) < MIN_POSITON_VALUE_TO_DISPLAY) {
        return null
      }
      const sizeDisplay = (poolId === POOL_IDS.A || poolId === POOL_IDS.B)
        ? '$' + formatLocalisedCompactNumber(formatFloat(Number(value) * pools[poolAddress].k.toNumber() / 2)) : ''

      return {
        poolAddress,
        pool: pools[poolAddress],
        token: poolAddress + '-' + poolId,
        poolId,
        balance: balances[poolAddress + '-' + poolId],
        entryValue,
        maturity: max(maturities[poolAddress + '-' + poolId]?.toNumber() - Math.floor(new Date().getTime() / 1000), 0),
        sizeDisplay,
        value,
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

  return <div className='positions-box'>
    {
      isPhone
        ? <div className='positions-list' >
          {
            displayPositions.map((position, key: number) => {
              return <div className='positions-list__item' key={key}>
                <InfoRow>
                  <Text>Position</Text>
                  <Token token={position.token} />
                </InfoRow>
                <InfoRow>
                  <Text>Net Value</Text>
                  <NetValue value={position.value}/>
                </InfoRow>
                { !position.entryValue ||
                <InfoRow>
                  <Text>PnL</Text>
                  <Pnl position={position}/>
                </InfoRow>
                }
                {
                  showSize && (
                    <InfoRow>
                      <Text>Size</Text>
                      <td><Text>{position.sizeDisplay}</Text></td>
                    </InfoRow>
                  )
                }
                { !position.maturity ||
                <InfoRow>
                  <Text>Maturity</Text>
                  <Maturity maturity={position.maturity}/>
                </InfoRow>
                }
                <InfoRow>
                  <Text>Reserve</Text>
                  <Reserve pool={position.pool}/>
                </InfoRow>
                {
                  settings.showBalance && <InfoRow>
                    <Text>Balance</Text>
                    <td>
                      <Text>{formatWeiToDisplayNumber(position.balance, 4, tokens[position.token].decimals)}</Text>
                    </td>
                  </InfoRow>
                }
                <InfoRow>
                  <Text>Pool</Text>
                  <ExplorerLink poolAddress={position.poolAddress}/>
                </InfoRow>

                <ButtonSell
                  className='btn-close'
                  onClick={() => {
                    setInputTokenAddress(position.token)
                    setOutputTokenAddress(wrapToNativeAddress(position.pool.TOKEN_R))
                    setVisible(true)
                  }}
                >{position.poolId === POOL_IDS.C ? 'Remove' : 'Close'}</ButtonSell>
              </div>
            })
          }
        </div>
        : <table className='positions-table'>
          <thead>
            <tr>
              <th>Position</th>
              <th>Net Value</th>
              {showSize && <th>Size</th>}
              <th>Maturity</th>
              <th>Reserve</th>
              {settings.showBalance && <th>Balance</th>}
              <th>Pool</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {
              displayPositions.map((position, key: number) => {
                return <tr
                  className='position-row'
                  onClick={() => {
                    setOutputTokenAddressToBuy(position.token)
                  }}
                  key={key}
                >
                  <td><Token token={position.token} /></td>
                  <td>
                    <div className='net-value-and-pnl'>
                      <NetValue value={position.value}/>
                      <Pnl position={position} />
                    </div>
                  </td>
                  {
                    showSize && (
                      <td><Text>{position.sizeDisplay}</Text></td>
                    )
                  }
                  <td><Maturity maturity={position.maturity} /></td>
                  <td><Reserve pool={position.pool}/></td>
                  {
                    settings.showBalance && <td>
                      <Text>{formatWeiToDisplayNumber(position.balance, 4, tokens[position.token].decimals)}</Text>
                    </td>
                  }
                  <td><ExplorerLink poolAddress={position.poolAddress}/></td>
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

export const NetValue = ({ value }: {value: string}) => {
  return <Text>${formatLocalisedCompactNumber(formatFloat(value))}</Text>
}

export const Pnl = ({ position }: { position: Position}) => {
  const { value, entryValue } = position
  if (!entryValue) {
    return <React.Fragment></React.Fragment>
  }
  const valueChange = sub(value, entryValue)
  const valueChangeDisplay = Number(valueChange) >= 0 ?
    `$${formatLocalisedCompactNumber(formatFloat(valueChange, 2))}` :
    `-$${formatLocalisedCompactNumber(-formatFloat(valueChange, 2))}`
  const pnl = div(valueChange, entryValue)
  return Number(pnl) >= 0
    ? <TextBuy>{valueChangeDisplay} ({formatPercent(pnl)}%)</TextBuy>
    : <TextSell>{valueChangeDisplay} ({formatPercent(pnl)}%)</TextSell>
}

export const Maturity = ({ maturity }: { maturity?: number}) => {
  return maturity
    ? <Text>
      <Cowntdown second={maturity} />(s)
    </Text>
    : <React.Fragment />
}

export const Reserve = ({ pool }: { pool: any}) => {
  const { tokens } = useListTokens()
  const { width } = useWindowSize()
  const isPhone = width && width < 992

  return <div className='d-flex gap-05 align-items-center'>
    <TokenIcon size={isPhone ? 18 : 24} tokenAddress={pool.TOKEN_R} />
    <Text>{tokens[pool.TOKEN_R]?.symbol}</Text>
  </div>
}

export const ExplorerLink = ({ poolAddress }: { poolAddress: string}) => {
  const { configs } = useConfigs()

  return <TextLink href={configs.explorer + '/address/' + poolAddress}>
    {shortenAddressString(poolAddress)}
  </TextLink>
}

export const Token = ({ token }: { token: string}) => {
  const { width } = useWindowSize()
  const isPhone = width && width < 992

  return <div className='d-flex gap-05 align-items-center'>
    <TokenIcon size={isPhone ? 18 : 24} tokenAddress={token} />
    <span><TokenSymbol token={token} /></span>
  </div>
}
