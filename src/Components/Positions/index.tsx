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
import { Text, TextBuy, TextLink, TextSell, TextWarning } from '../ui/Text'
import { useConfigs } from '../../state/config/useConfigs'
import { TokenIcon } from '../ui/TokenIcon'
import { TokenSymbol } from '../ui/TokenSymbol'
import { ClosePosition } from '../ClosePositionModal'
import { useTokenValue } from '../SwapBox/hooks/useTokenValue'
import { useHelper } from '../../state/config/useHelper'
import { useSettings } from '../../state/setting/hooks/useSettings'
import { useSwapHistory } from '../../state/wallet/hooks/useSwapHistory'
import _ from 'lodash'
import { useWindowSize } from '../../hooks/useWindowSize'
import { InfoRow } from '../ui/InfoRow'
import moment from 'moment'

type Position = {
  poolAddress: string
  token: string
  pool: PoolType
  side: number
  balance: BigNumber
  entryValue: string
  entryPrice: string
  vested: number
  matured: number
  sizeDisplay: string
  value: string
  closingFee: number
}

const Q128 = BigNumber.from(1).shl(128)

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

  const [now, setNow] = React.useState(new Date().getTime())

  // TODO: put this to App, and pass down to each comp
  React.useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date().getTime())
    }, 1000)
    return () => {
      clearInterval(timer)
    }
  }, [])

  const positionsWithEntry = useMemo(() => {
    if (ddlEngine?.HISTORY && Object.values(pools).length > 0 && ddlEngine?.CURRENT_POOL.pools && id) {
      return ddlEngine.HISTORY.generatePositions?.({
        tokens: Object.values(tokens),
        logs: _.cloneDeep(sls)
      }) ?? {}
    }
    return {}
  }, [sls, pools, ddlEngine?.CURRENT_POOL, id, tokens])

  const generatePositionData = (poolAddress: string, side: number): Position | null => {
    const token = poolAddress + '-' + side

    if (balances[token]?.gt(0)) {
      const positionEntry = positionsWithEntry[token]
      const entryValue = positionEntry?.entry ?? 0
      const value = getTokenValue(
        token,
        weiToNumber(balances[token], tokens[token]?.decimal || 18)
      )
      if (Number(value) < MIN_POSITON_VALUE_TO_DISPLAY) {
        return null
      }
      const sizeDisplay = (side === POOL_IDS.A || side === POOL_IDS.B)
        ? '$' + formatLocalisedCompactNumber(formatFloat(Number(value) * pools[poolAddress].k.toNumber() / 2)) : ''

      const pool = pools[poolAddress]
      const MATURITY = pool.MATURITY.toNumber() * 1000
      const MATURITY_VEST = pool.MATURITY_VEST.toNumber() * 1000
      const maturity = maturities?.[token]?.toNumber() ?? 0
      const matured = max(maturity * 1000, now)
      const vested = max(matured - MATURITY + MATURITY_VEST, now)

      const closingFee = pool.MATURITY_RATE.isZero() ? 0
        : Q128.sub(pool.MATURITY_RATE).mul(10000).div(Q128).toNumber() / 10000

      return {
        poolAddress,
        pool,
        token,
        side,
        balance: balances[token],
        entryValue,
        entryPrice: '0',
        vested,
        matured,
        sizeDisplay,
        value,
        closingFee
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
          return p.side === POOL_IDS.C
        }
        if (tradeType === TRADE_TYPE.LONG || tradeType === TRADE_TYPE.SHORT) {
          return p.side === POOL_IDS.A || p.side === POOL_IDS.B
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
                  showSize && !!position.sizeDisplay && (
                    <InfoRow>
                      <Text>Size</Text>
                      <td><Text>{position.sizeDisplay}</Text></td>
                    </InfoRow>
                  )
                }
                { !position.matured || position.matured <= now ||
                <InfoRow>
                  <Text>Closing Fee</Text>
                  <ClosingFee now={now} position={position}/>
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

                <InfoRow>
                  <ButtonSell
                    className='btn-close'
                    onClick={() => {
                      setInputTokenAddress(position.token)
                      setOutputTokenAddress(wrapToNativeAddress(position.pool.TOKEN_R))
                      setVisible(true)
                    }}
                  >{position.side === POOL_IDS.C ? 'Remove' : 'Close'}</ButtonSell>
                </InfoRow>
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
              <th>Closing Fee</th>
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
                  <td><ClosingFee now={now} position={position}/></td>
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
                    >{position.side === POOL_IDS.C ? 'Remove' : 'Close'}</ButtonSell>
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
  if (!entryValue || !Number(entryValue)) {
    return <React.Fragment />
  }
  const valueChange = sub(value, entryValue)
  const valueChangeDisplay = Number(valueChange) >= 0
    ? `+$${formatLocalisedCompactNumber(formatFloat(valueChange, 2))}`
    : `-$${formatLocalisedCompactNumber(-formatFloat(valueChange, 2))}`
  const pnl = div(valueChange, entryValue)
  return Number(pnl) >= 0
    ? <TextBuy>{valueChangeDisplay} (+{formatPercent(pnl)}%)</TextBuy>
    : <TextSell>{valueChangeDisplay} ({formatPercent(pnl)}%)</TextSell>
}

export const ClosingFee = ({ now, position }: { now: number, position: Position}) => {
  const { vested, matured, closingFee, pool } = position
  const MATURITY_VEST = pool.MATURITY_VEST.toNumber()

  if (MATURITY_VEST > 0 && vested > now) {
    const fee = closingFee + (1 - closingFee) * (vested - now) / MATURITY_VEST / 1000
    return <div>
      <div><TextSell>{formatPercent(fee, 2, true)}%</TextSell></div>
      <div><TextSell>for {moment(vested).fromNow(true)}</TextSell></div>
    </div>
  }

  if (pool.MATURITY.toNumber() > 0 && matured > now) {
    return <div>
      <div><TextWarning>{formatPercent(closingFee, 2, true)}%</TextWarning></div>
      <div><TextWarning>for {moment(matured).fromNow(true)}</TextWarning></div>
    </div>
  }

  return <React.Fragment />
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
