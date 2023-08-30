import React, { useMemo, useState } from 'react'
import './style.scss'
import { useCurrentPoolGroup } from '../../state/currentPool/hooks/useCurrentPoolGroup'
import { useWalletBalance } from '../../state/wallet/hooks/useBalances'
import { MIN_POSITON_VALUE_TO_DISPLAY, POOL_IDS, TRADE_TYPE } from '../../utils/constant'
import {
  bn,
  decodeErc1155Address,
  div,
  formatFloat,
  formatPercent,
  formatZeroDecimal,
  kx,
  max,
  mul,
  shortenAddressString,
  sub,
  weiToNumber,
  xr
} from '../../utils/helpers'
import { useListTokens } from '../../state/token/hook'
import { PoolType } from '../../state/resources/type'
import { ButtonSell } from '../ui/Button'
import formatLocalisedCompactNumber, { formatWeiToDisplayNumber } from '../../utils/formatBalance'
import { BigNumber } from 'ethers'
import { Text, TextBuy, TextError, TextLink, TextSell, TextWarning } from '../ui/Text'
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
  valueUsd: string
  closingFee: number
  leverage: number
  effectiveLeverage: number
  deleveragePrice: string
  funding: number,
}

const Q128 = BigNumber.from(1).shl(128)

export enum VALUE_IN_USD_STATUS {
  AUTO,
  USD,
  TOKEN_R,
}

export const Positions = ({ setOutputTokenAddressToBuy, tokenOutMaturity }: { setOutputTokenAddressToBuy: any, tokenOutMaturity: BigNumber }) => {
  const { pools, tradeType } = useCurrentPoolGroup()
  const { balances, maturities } = useWalletBalance()
  const { tokens } = useListTokens()
  const { getTokenValue } = useTokenValue({})
  const { wrapToNativeAddress } = useHelper()
  const { settings } = useSettings()
  const [valueInUsdStatus, setValueInUsdStatus] = useState<VALUE_IN_USD_STATUS>(VALUE_IN_USD_STATUS.TOKEN_R)
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
        logs: _.cloneDeep(sls),
        valueInUsd: valueInUsdStatus
      }) ?? {}
    }
    return {}
  }, [sls, pools, ddlEngine?.CURRENT_POOL, id, tokens, valueInUsdStatus])

  const generatePositionData = (poolAddress: string, side: number): Position | null => {
    const token = poolAddress + '-' + side

    if (balances[token]?.gt(0)) {
      const posWithEntry = positionsWithEntry[token]
      const entryPrice = posWithEntry?.entryPrice
      const entryValue = posWithEntry?.balance?.gt(0) ? div(mul(balances[token], posWithEntry?.entry ?? 0), posWithEntry.balance) : '0'
      const value = getTokenValue(
        token,
        weiToNumber(balances[token], tokens[token]?.decimal || 18),
        isShowValueInUsd(valueInUsdStatus, pools[poolAddress])
      )
      const valueUsd = isShowValueInUsd(valueInUsdStatus, pools[poolAddress]) ? value : getTokenValue(
        token,
        weiToNumber(balances[token], tokens[token]?.decimal || 18)
      )

      if (Number(value) < MIN_POSITON_VALUE_TO_DISPLAY) {
        return null
      }
      const pool = pools[poolAddress]
      const { states: { a, b, R, spot }, MARK, baseToken, quoteToken } = pool
      const k = pool.k.toNumber()
      const kA = kx(k, R, a, spot, MARK)
      const kB = -kx(-k, R, b, spot, MARK)
      const ek =
        side === POOL_IDS.A ? kA
          : side === POOL_IDS.B ? kB
            : Math.min(kA, kB)
      const effectiveLeverage = Math.min(ek, k) / 2

      const decimalsOffset = (tokens?.[baseToken]?.decimal ?? 18) - (tokens?.[quoteToken]?.decimal ?? 18)
      const mark = MARK ? MARK.mul(MARK).mul((bn(10).pow(decimalsOffset + 12))).shr(256).toNumber() / 1000000000000 : 1

      const xA = xr(k, R.shr(1), a)
      const xB = xr(-k, R.shr(1), b)
      const dgA = xA * xA * mark
      const dgB = xB * xB * mark
      const deleveragePrice =
        side === POOL_IDS.A ? formatZeroDecimal(dgA)
          : side === POOL_IDS.B ? formatZeroDecimal(dgB)
            : `${formatZeroDecimal(dgB)}-${formatZeroDecimal(dgA)}`

      const sizeDisplay = (side === POOL_IDS.A || side === POOL_IDS.B)
        ? '$' + formatLocalisedCompactNumber(formatFloat(Number(value) * effectiveLeverage)) : ''

      const MATURITY = pool.MATURITY.toNumber() * 1000
      const MATURITY_VEST = pool.MATURITY_VEST.toNumber() * 1000
      const maturity = maturities?.[token]?.toNumber() ?? 0
      const matured = max(maturity * 1000, now)
      const vested = max(matured - MATURITY + MATURITY_VEST, now)

      const closingFee = pool.MATURITY_RATE.isZero() ? 0
        : Q128.sub(pool.MATURITY_RATE).mul(10000).div(Q128).toNumber() / 10000

      const _interest = ((pool?.dailyInterestRate ?? 0) / k)
      const funding = side === POOL_IDS.C
        ? _interest - Number(pool?.premium?.C ?? 0)
        : _interest + Number(pool?.premium[side === POOL_IDS.A ? 'A' : side === POOL_IDS.B ? 'B' : 'C'] ?? 0)

      return {
        poolAddress,
        pool,
        token,
        side,
        balance: balances[token],
        entryValue,
        entryPrice,
        vested,
        matured,
        sizeDisplay,
        value,
        valueUsd,
        closingFee,
        leverage: k / 2,
        effectiveLeverage,
        deleveragePrice,
        funding
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
                {
                  !settings.showBalance || <InfoRow>
                    <Text>Balance</Text>
                    <Text>{formatWeiToDisplayNumber(position.balance, 4, tokens[position.token].decimals)}</Text>
                  </InfoRow>
                }
                <InfoRow>
                  <Text>Net Value</Text>
                  <NetValue valueInUsdStatus={valueInUsdStatus} valueUsd={position.valueUsd} value={position.value} pool={position.pool} isPhone />
                </InfoRow>
                { !position.entryValue ||
                <InfoRow>
                  <Text>
                    PnL
                    <Text
                      className='text-link'
                      onClick={() => {
                        setValueInUsdStatus(valueInUsdStatus === VALUE_IN_USD_STATUS.USD ? VALUE_IN_USD_STATUS.TOKEN_R : VALUE_IN_USD_STATUS.USD)
                      }}
                    >{valueInUsdStatus === VALUE_IN_USD_STATUS.USD ? ` ⇄ ${tokens[wrapToNativeAddress(position.pool.TOKEN_R)]?.symbol}` : ' ⇄ USD'}
                    </Text>
                  </Text>
                  <Pnl valueInUsdStatus={valueInUsdStatus} position={position} isPhone/>
                </InfoRow>
                }
                { !showSize || !position.sizeDisplay ||
                  <InfoRow>
                    <Text>Position Size</Text>
                    {
                      position.effectiveLeverage < position.leverage / 2
                        ? <TextError>{position.sizeDisplay}</TextError>
                        : position.effectiveLeverage < position.leverage
                          ? <TextWarning>{position.sizeDisplay}</TextWarning>
                          : <Text>{position.sizeDisplay}</Text>
                    }
                  </InfoRow>
                }
                { !position.entryPrice ||
                  <InfoRow>
                    <Text>Entry Price</Text>
                    <Text>{formatZeroDecimal(formatFloat(position.entryPrice))}</Text>
                  </InfoRow>
                }
                <InfoRow>
                  <Text>Deleverage Price</Text>
                  {
                    position.effectiveLeverage < position.leverage / 2
                      ? <TextError>{position.deleveragePrice}</TextError>
                      : position.effectiveLeverage < position.leverage
                        ? <TextWarning>{position.deleveragePrice}</TextWarning>
                        : <Text>{position.deleveragePrice}</Text>
                  }
                </InfoRow>
                <InfoRow>
                  {tradeType == TRADE_TYPE.LIQUIDITY ? <Text>Funding Yield</Text> : <Text>Funding Rate</Text>}
                  <Text className={(position.funding < 0 || position.side == POOL_IDS.C) ? 'text-green' : ''}>
                    {formatPercent(position.funding, 3, true)}%
                  </Text>
                </InfoRow>

                { !position.matured || position.matured <= now ||
                <InfoRow>
                  <Text>Closing Fee</Text>
                  <ClosingFee now={now} position={position}/>
                </InfoRow>
                }
                {/* <InfoRow>
                  <Text>Reserve</Text>
                  <Reserve pool={position.pool}/>
                </InfoRow> */}
                {/* <InfoRow>
                  <Text>Pool</Text>
                  <ExplorerLink poolAddress={position.poolAddress}/>
                </InfoRow> */}

                <InfoRow>
                  <ButtonSell
                    className='btn-close'
                    size='small'
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
              <th className='no-wrap'>
                Net Value
                <Text
                  className='text-link'
                  onClick={() => {
                    setValueInUsdStatus(valueInUsdStatus === VALUE_IN_USD_STATUS.USD ? VALUE_IN_USD_STATUS.TOKEN_R : VALUE_IN_USD_STATUS.USD)
                  }}
                >{valueInUsdStatus === VALUE_IN_USD_STATUS.USD ? ` ⇄ ${tokens[wrapToNativeAddress(positions?.[0].pool.TOKEN_R)]?.symbol}` : ' ⇄ USD'}
                </Text>
              </th>
              {showSize && <th>Pos. Size</th>}
              <th>Entry Price</th>
              <th>Delev. Price</th>
              <th>Funding</th>
              <th>Closing Fee</th>
              {/* <th>Reserve</th> */}
              {/* <th>Pool</th> */}
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
                  <td>
                    <Token
                      token={position.token}
                      balance={!settings.showBalance
                        ? undefined
                        : formatWeiToDisplayNumber(position.balance, 4, tokens[position.token].decimals)
                      }
                    />
                  </td>
                  <td>
                    <div className='net-value-and-pnl'>
                      <NetValue valueInUsdStatus={valueInUsdStatus} valueUsd={position.valueUsd} value={position.value} pool={position.pool}/>
                      <Pnl valueInUsdStatus={valueInUsdStatus} position={position} />
                    </div>
                  </td>
                  {
                    !showSize ||
                    <td>
                      {
                        position.effectiveLeverage < position.leverage / 2
                          ? <TextError>{position.sizeDisplay}</TextError>
                          : position.effectiveLeverage < position.leverage
                            ? <TextWarning>{position.sizeDisplay}</TextWarning>
                            : <Text>{position.sizeDisplay}</Text>
                      }
                    </td>
                  }
                  <td>
                    { !position.entryPrice ||
                    <Text>{formatZeroDecimal(formatFloat(position.entryPrice))}</Text>
                    }
                  </td>
                  <td>
                    {
                      position.effectiveLeverage < position.leverage / 2
                        ? <TextError>{position.deleveragePrice}</TextError>
                        : position.effectiveLeverage < position.leverage
                          ? <TextWarning>{position.deleveragePrice}</TextWarning>
                          : <Text>{position.deleveragePrice}</Text>
                    }
                  </td>
                  <td>
                    <Text className={(position.funding < 0 || position.side == POOL_IDS.C) ? 'text-green' : ''}>
                      {formatPercent(position.funding, 2, true)}%
                    </Text>
                  </td>
                  <td><ClosingFee now={now} position={position}/></td>
                  {/* <td><Reserve pool={position.pool}/></td> */}
                  {/* <td><ExplorerLink poolAddress={position.poolAddress}/></td> */}
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

export const NetValue = ({ value, valueUsd, pool, valueInUsdStatus, isPhone }: {value: string, valueUsd: string, pool: PoolType, valueInUsdStatus: VALUE_IN_USD_STATUS, isPhone?: boolean}) => {
  const valueR = <React.Fragment>
    {isShowValueInUsd(valueInUsdStatus, pool) ? '$' : <TokenIcon tokenAddress={pool?.TOKEN_R} size={16}/>}
    {formatLocalisedCompactNumber(formatFloat(value))}
  </React.Fragment>
  const valueUSD = <React.Fragment>
    {isShowValueInUsd(valueInUsdStatus, pool) ? '' : `($${formatLocalisedCompactNumber(formatFloat(valueUsd))})`}
  </React.Fragment>
  if (isPhone) {
    return <Text className='d-flex align-item-center'>{valueUSD}&nbsp;{valueR}</Text>
  }
  return <Text className='d-flex align-item-center'>{valueR}&nbsp;{valueUSD}</Text>
}

export const Pnl = ({ position, isPhone, valueInUsdStatus }: { position: Position, isPhone?: boolean, valueInUsdStatus: VALUE_IN_USD_STATUS }) => {
  const { value, entryValue } = position
  if (!entryValue || !Number(entryValue)) {
    return <React.Fragment />
  }
  const valueChange = sub(value, entryValue)
  const valueChangeDisplay = Number(valueChange) >= 0
    ? <Text className='d-flex align-item-center'>+{isShowValueInUsd(valueInUsdStatus, position?.pool) ? '$' : <TokenIcon tokenAddress={position?.pool?.TOKEN_R} size={16}/>}{formatLocalisedCompactNumber(formatFloat(valueChange))}</Text>
    : <Text className='d-flex align-item-center'>-{isShowValueInUsd(valueInUsdStatus, position?.pool) ? '$' : <TokenIcon tokenAddress={position?.pool?.TOKEN_R} size={16}/>}{formatLocalisedCompactNumber(-formatFloat(valueChange))} </Text>
  const pnl = div(valueChange, entryValue)

  if (isPhone) {
    return Number(pnl) >= 0
      ? <TextBuy className='pnl'>(+{formatPercent(pnl)}%)&nbsp;{valueChangeDisplay}</TextBuy>
      : <TextSell className='pnl'>({formatPercent(pnl)}%)&nbsp;{valueChangeDisplay}</TextSell>
  }
  return Number(pnl) >= 0
    ? <TextBuy className='pnl'>{valueChangeDisplay}&nbsp;(+{formatPercent(pnl)}%)</TextBuy>
    : <TextSell className='pnl'>{valueChangeDisplay}&nbsp;({formatPercent(pnl)}%)</TextSell>
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

export const Token = ({ token, balance }: { token: string, balance?: string }) => {
  const { width } = useWindowSize()
  const isPhone = width && width < 992

  return <div className='d-flex gap-05 align-items-center'>
    <TokenIcon size={isPhone ? 18 : 24} tokenAddress={token} />
    <div>
      <div><TokenSymbol token={token} /></div>
      {!balance || <div><Text>{balance}</Text></div>}
    </div>
  </div>
}

const isShowValueInUsd = (valueInUsdStatus: VALUE_IN_USD_STATUS, pool: PoolType) => {
  return valueInUsdStatus === VALUE_IN_USD_STATUS.USD || (valueInUsdStatus === VALUE_IN_USD_STATUS.AUTO && pool?.baseToken === pool?.TOKEN_R)
}
