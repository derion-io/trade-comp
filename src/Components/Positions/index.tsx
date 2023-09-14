import React, { useMemo, useState } from 'react'
import './style.scss'
import { useCurrentPoolGroup } from '../../state/currentPool/hooks/useCurrentPoolGroup'
import { useWalletBalance } from '../../state/wallet/hooks/useBalances'
import {
  MIN_POSITON_VALUE_USD_TO_DISPLAY,
  POOL_IDS,
  TRADE_TYPE
} from '../../utils/constant'
import {
  bn,
  decodeErc1155Address,
  div,
  formatFloat,
  formatPercent,
  zerofy,
  kx,
  max,
  mul,
  shortenAddressString,
  sub,
  IEW,
  xr
} from '../../utils/helpers'
import { useListTokens } from '../../state/token/hook'
import { PoolType } from '../../state/resources/type'
import { ButtonSell } from '../ui/Button'
import formatLocalisedCompactNumber, {
  formatWeiToDisplayNumber
} from '../../utils/formatBalance'
import { BigNumber } from 'ethers'
import {
  Text,
  TextBuy,
  TextError,
  TextLink,
  TextSell,
  TextWarning
} from '../ui/Text'
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
import { ClosingFeeCalculator, Position } from '../../utils/type'

export enum VALUE_IN_USD_STATUS {
  AUTO,
  USD,
  TOKEN_R
}

export const Positions = ({
  setOutputTokenAddressToBuy,
  tokenOutMaturity
}: {
  setOutputTokenAddressToBuy: any
  tokenOutMaturity: BigNumber
}) => {
  const { pools, tradeType } = useCurrentPoolGroup()
  const { balances, maturities } = useWalletBalance()
  const { tokens } = useListTokens()
  const { getTokenValue } = useTokenValue({})
  const { wrapToNativeAddress } = useHelper()
  const { settings } = useSettings()
  const [valueInUsdStatus, setValueInUsdStatus] = useState<VALUE_IN_USD_STATUS>(
    VALUE_IN_USD_STATUS.TOKEN_R
  )
  const [visible, setVisible] = useState<boolean>(false)
  const [ closingPosition, setClosingPosition ] = useState<Position | undefined>(undefined)
  const [outputTokenAddress, setOutputTokenAddress] = useState<string>('')
  const { ddlEngine } = useConfigs()
  const { id } = useCurrentPoolGroup()
  const { swapLogs: sls } = useSwapHistory()
  const { width } = useWindowSize()
  const isPhone = width && width < 992

  const [now, setNow] = React.useState(Math.floor(new Date().getTime() / 1000))

  // TODO: put this to App, and pass down to each comp
  React.useEffect(() => {
    const timer = setInterval(() => {
      setNow(Math.floor(new Date().getTime() / 1000))
    }, 1000)
    return () => {
      clearInterval(timer)
    }
  }, [])

  const positionsWithEntry = useMemo(() => {
    if (
      ddlEngine?.HISTORY &&
      Object.values(pools).length > 0 &&
      ddlEngine?.CURRENT_POOL.pools &&
      id
    ) {
      return (
        ddlEngine.HISTORY.generatePositions?.({
          tokens: Object.values(tokens),
          logs: _.cloneDeep(sls)
        }) ?? {}
      )
    }
    return {}
  }, [sls, pools, ddlEngine?.CURRENT_POOL, id, tokens, valueInUsdStatus])

  const generatePositionData = (
    poolAddress: string,
    side: number
  ): Position | null => {
    const token = poolAddress + '-' + side

    if (balances[token]?.gt(0)) {
      const pool = pools[poolAddress]
      const posWithEntry = positionsWithEntry[token]
      const entryPrice = posWithEntry?.entryPrice
      const entryValue = posWithEntry?.balance?.gt(0)
        ? div(
            mul(balances[token], posWithEntry?.entry ?? 0),
            posWithEntry.balance
          )
        : '0'
      const entryValueR = IEW(
        posWithEntry?.totalEntryR ?? 0,
        tokens[pool.TOKEN_R]?.decimal ?? 18
      )
      const value = getTokenValue(
        token,
        IEW(balances[token], tokens[token]?.decimal || 18),
        false
      )
      const valueUsd = getTokenValue(
        token,
        IEW(balances[token], tokens[token]?.decimal || 18),
        true
      )

      if (Number(valueUsd) < MIN_POSITON_VALUE_USD_TO_DISPLAY) {
        return null
      }
      const {
        states: { a, b, R, spot },
        MARK,
        baseToken,
        quoteToken
      } = pool
      const k = pool.k.toNumber()
      const kA = kx(k, R, a, spot, MARK)
      const kB = -kx(-k, R, b, spot, MARK)
      const ek =
        side === POOL_IDS.A ? kA : side === POOL_IDS.B ? kB : Math.min(kA, kB)
      const effectiveLeverage = Math.min(ek, k) / 2

      const decimalsOffset =
        (tokens?.[baseToken]?.decimal ?? 18) -
        (tokens?.[quoteToken]?.decimal ?? 18)
      const mark = MARK
        ? MARK.mul(MARK)
            .mul(bn(10).pow(decimalsOffset + 12))
            .shr(256)
            .toNumber() / 1000000000000
        : 1

      const xA = xr(k, R.shr(1), a)
      const xB = xr(-k, R.shr(1), b)
      const dgA = xA * xA * mark
      const dgB = xB * xB * mark
      const deleveragePrice =
        side === POOL_IDS.A
          ? zerofy(dgA)
          : side === POOL_IDS.B
          ? zerofy(dgB)
          : `${zerofy(dgB)}-${zerofy(dgA)}`

      const sizeDisplay =
        side === POOL_IDS.A || side === POOL_IDS.B
          ? '$' +
            formatLocalisedCompactNumber(
              formatFloat((Number(valueUsd) * k) / 2)
            )
          : ''

      const feeCalculator = new ClosingFeeCalculator({
        MATURITY: pool.MATURITY.toNumber(),
        MATURITY_VEST: pool.MATURITY_VEST.toNumber(),
        MATURITY_RATE: pool.MATURITY_RATE,
        maturity: maturities?.[token]?.toNumber() ?? 0,
      })

      const _interest = pool?.dailyInterestRate ?? 0
      const funding =
        side === POOL_IDS.C
          ? _interest - Number(pool?.premium?.C ?? 0)
          : _interest +
            Number(
              pool?.premium[
                side === POOL_IDS.A ? 'A' : side === POOL_IDS.B ? 'B' : 'C'
              ] ?? 0
            )

      return {
        poolAddress,
        pool,
        token,
        side,
        balance: balances[token],
        entryValueR,
        entryValue,
        entryPrice,
        sizeDisplay,
        value,
        valueUsd,
        leverage: k / 2,
        effectiveLeverage,
        deleveragePrice,
        funding,
        closingFee: (now?: number): any => {return feeCalculator.calculateFee(now)}
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

  const [displayPositions, hasClosingFee] = useMemo(() => {
    let displayPositions: Position[] = []
    if (positions && positions.length > 0) {
      displayPositions = positions.filter((p) => {
        if (tradeType === TRADE_TYPE.LIQUIDITY) {
          return p.side === POOL_IDS.C
        }
        if (tradeType === TRADE_TYPE.LONG || tradeType === TRADE_TYPE.SHORT) {
          return p.side === POOL_IDS.A || p.side === POOL_IDS.B
        }
        return true
      })
    }
    const hasClosingFee = displayPositions.some(
      (p) => p.closingFee(now).fee > 0
    )
    return [displayPositions, hasClosingFee]
  }, [positions, tradeType])

  const showSize = tradeType !== TRADE_TYPE.LIQUIDITY

  return (
    <div className='positions-box'>
      {isPhone ? (
        <div className='positions-list'>
          {displayPositions.map((position, key: number) => {
            return (
              <div className='positions-list__item' key={key}>
                <InfoRow>
                  <Text>Position</Text>
                  <Token token={position.token} />
                </InfoRow>
                {!settings.showBalance || (
                  <InfoRow>
                    <Text>Balance</Text>
                    <Text>
                      {formatWeiToDisplayNumber(
                        position.balance,
                        4,
                        tokens[position.token].decimals
                      )}
                    </Text>
                  </InfoRow>
                )}
                <InfoRow>
                  <Text>Net Value</Text>
                  <NetValue
                    valueInUsdStatus={valueInUsdStatus}
                    valueUsd={position.valueUsd}
                    value={position.value}
                    pool={position.pool}
                    isPhone
                  />
                </InfoRow>
                {!position.entryValue || (
                  <InfoRow>
                    <Text>
                      PnL
                      <Text
                        className='text-link'
                        onClick={() => {
                          setValueInUsdStatus(
                            valueInUsdStatus === VALUE_IN_USD_STATUS.USD
                              ? VALUE_IN_USD_STATUS.TOKEN_R
                              : VALUE_IN_USD_STATUS.USD
                          )
                        }}
                      >
                        {valueInUsdStatus === VALUE_IN_USD_STATUS.USD
                          ? ` ⇄ ${
                              tokens[wrapToNativeAddress(position.pool.TOKEN_R)]
                                ?.symbol
                            }`
                          : ' ⇄ USD'}
                      </Text>
                    </Text>
                    <Pnl
                      valueInUsdStatus={valueInUsdStatus}
                      position={position}
                      isPhone
                    />
                  </InfoRow>
                )}
                {!showSize || !position.sizeDisplay || (
                  <InfoRow>
                    <Text>Size</Text>
                    {position.effectiveLeverage < position.leverage / 2 ? (
                      <TextError>{position.sizeDisplay}</TextError>
                    ) : position.effectiveLeverage < position.leverage ? (
                      <TextWarning>{position.sizeDisplay}</TextWarning>
                    ) : (
                      <Text>{position.sizeDisplay}</Text>
                    )}
                  </InfoRow>
                )}
                {!position.entryPrice || (
                  <InfoRow>
                    <Text>Entry Price</Text>
                    <Text>{zerofy(formatFloat(position.entryPrice))}</Text>
                  </InfoRow>
                )}
                <InfoRow>
                  <Text>Deleverage Price</Text>
                  {position.effectiveLeverage < position.leverage / 2 ? (
                    <TextError>{position.deleveragePrice}</TextError>
                  ) : position.effectiveLeverage < position.leverage ? (
                    <TextWarning>{position.deleveragePrice}</TextWarning>
                  ) : (
                    <Text>{position.deleveragePrice}</Text>
                  )}
                </InfoRow>
                <InfoRow>
                  <Text>
                    {position.side === POOL_IDS.C
                      ? 'Funding Yield'
                      : 'Funding Rate'}
                  </Text>
                  <Text
                    className={
                      position.funding < 0 || position.side === POOL_IDS.C
                        ? 'text-green'
                        : ''
                    }
                  >
                    {formatPercent(position.funding, 3, true)}%
                  </Text>
                </InfoRow>

                {!position.closingFee(now).fee || (
                  <InfoRow>
                    <Text>Closing Fee</Text>
                    <ClosingFee
                      now={now}
                      position={position}
                      isPhone={isPhone}
                    />
                  </InfoRow>
                )}
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
                      setClosingPosition(position)
                      setOutputTokenAddress(
                        wrapToNativeAddress(position.pool.TOKEN_R)
                      )
                      setVisible(true)
                    }}
                  >
                    {position.side === POOL_IDS.C ? 'Remove' : 'Close'}
                  </ButtonSell>
                </InfoRow>
              </div>
            )
          })}
        </div>
      ) : (
        <table className='positions-table'>
          <thead>
            <tr>
              <th>Position</th>
              <th className='no-wrap'>
                Net Value
                {positions?.length > 0 && (
                  <Text
                    className='text-link'
                    onClick={() => {
                      setValueInUsdStatus(
                        valueInUsdStatus === VALUE_IN_USD_STATUS.USD
                          ? VALUE_IN_USD_STATUS.TOKEN_R
                          : VALUE_IN_USD_STATUS.USD
                      )
                    }}
                  >
                    {valueInUsdStatus === VALUE_IN_USD_STATUS.USD
                      ? ` ⇄ ${
                          tokens[
                            wrapToNativeAddress(positions?.[0].pool.TOKEN_R)
                          ]?.symbol
                        }`
                      : ' ⇄ USD'}
                  </Text>
                )}
              </th>
              {showSize && <th>Size</th>}
              <th>Entry Price</th>
              <th>Delev. Price</th>
              <th>Funding</th>
              {!hasClosingFee || <th>Closing Fee</th>}
              {/* <th>Reserve</th> */}
              {/* <th>Pool</th> */}
              <th />
            </tr>
          </thead>
          <tbody>
            {displayPositions.map((position, key: number) => {
              return (
                <tr
                  className='position-row'
                  onClick={() => {
                    setOutputTokenAddressToBuy(position.token)
                  }}
                  key={key}
                >
                  <td>
                    <Token
                      token={position.token}
                      balance={
                        !settings.showBalance
                          ? undefined
                          : formatWeiToDisplayNumber(
                              position.balance,
                              4,
                              tokens[position.token].decimals
                            )
                      }
                    />
                  </td>
                  <td>
                    <div className='net-value-and-pnl'>
                      <NetValue
                        valueInUsdStatus={valueInUsdStatus}
                        valueUsd={position.valueUsd}
                        value={position.value}
                        pool={position.pool}
                      />
                      <Pnl
                        valueInUsdStatus={valueInUsdStatus}
                        position={position}
                      />
                    </div>
                  </td>
                  {!showSize || (
                    <td>
                      {position.effectiveLeverage < position.leverage / 2 ? (
                        <TextError>{position.sizeDisplay}</TextError>
                      ) : position.effectiveLeverage < position.leverage ? (
                        <TextWarning>{position.sizeDisplay}</TextWarning>
                      ) : (
                        <Text>{position.sizeDisplay}</Text>
                      )}
                    </td>
                  )}
                  <td>
                    {!position.entryPrice || (
                      <Text>{zerofy(formatFloat(position.entryPrice))}</Text>
                    )}
                  </td>
                  <td>
                    {position.effectiveLeverage < position.leverage / 2 ? (
                      <TextError>{position.deleveragePrice}</TextError>
                    ) : position.effectiveLeverage < position.leverage ? (
                      <TextWarning>{position.deleveragePrice}</TextWarning>
                    ) : (
                      <Text>{position.deleveragePrice}</Text>
                    )}
                  </td>
                  <td>
                    <Text
                      className={
                        position.funding < 0 || position.side === POOL_IDS.C
                          ? 'text-green'
                          : ''
                      }
                    >
                      {formatLocalisedCompactNumber(
                        formatPercent(position.funding, 2, true)
                      )}
                      %
                    </Text>
                  </td>
                  {!hasClosingFee || (
                    <td>
                      <ClosingFee now={now} position={position} />
                    </td>
                  )}
                  {/* <td><Reserve pool={position.pool}/></td> */}
                  {/* <td><ExplorerLink poolAddress={position.poolAddress}/></td> */}
                  <td className='text-right'>
                    <ButtonSell
                      size='small'
                      onClick={() => {
                        setClosingPosition(position)
                        setOutputTokenAddress(
                          wrapToNativeAddress(position.pool.TOKEN_R)
                        )
                        setVisible(true)
                      }}
                    >
                      {position.side === POOL_IDS.C ? 'Remove' : 'Close'}
                    </ButtonSell>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
      {visible && closingPosition != null ? (
        <ClosePosition
          visible={visible}
          setVisible={setVisible}
          position={closingPosition}
          outputTokenAddress={outputTokenAddress}
          tokenOutMaturity={tokenOutMaturity}
          title={
            Number(decodeErc1155Address(closingPosition.token).id) ===
            POOL_IDS.C ? (
              <Text>
                Remove <TokenSymbol token={closingPosition.token} textWrap={Text} />{' '}
              </Text>
            ) : (
              <Text>
                Close <TokenSymbol token={closingPosition.token} textWrap={Text} />{' '}
              </Text>
            )
          }
        />
      ) : (
        ''
      )}
    </div>
  )
}

export const NetValue = ({
  value,
  valueUsd,
  pool,
  valueInUsdStatus,
  isPhone
}: {
  value: string
  valueUsd: string
  pool: PoolType
  valueInUsdStatus: VALUE_IN_USD_STATUS
  isPhone?: boolean
}) => {
  const valueR = (
    <React.Fragment>
      <TokenIcon tokenAddress={pool?.TOKEN_R} size={16} />
      {formatLocalisedCompactNumber(formatFloat(value))}
    </React.Fragment>
  )
  const valueUSD = '$' + formatLocalisedCompactNumber(formatFloat(valueUsd))
  const valueMain = (
    <React.Fragment>
      {isShowValueInUsd(valueInUsdStatus, pool) ? valueUSD : valueR}
    </React.Fragment>
  )
  const valueSub = isShowValueInUsd(valueInUsdStatus, pool)
    ? ''
    : `(${valueUSD})`
  if (isPhone) {
    return (
      <Text className='d-flex align-item-center'>
        {valueSub}&nbsp;{valueMain}
      </Text>
    )
  }
  return (
    <Text className='d-flex align-item-center'>
      {valueMain}&nbsp;{valueSub}
    </Text>
  )
}

export const Pnl = ({
  position,
  isPhone,
  valueInUsdStatus
}: {
  position: Position
  isPhone?: boolean
  valueInUsdStatus: VALUE_IN_USD_STATUS
}) => {
  const [value, entryValue] = isShowValueInUsd(valueInUsdStatus, position?.pool)
    ? [position.valueUsd, position.entryValue]
    : [position.value, position.entryValueR]
  if (!entryValue || !Number(entryValue)) {
    return <React.Fragment />
  }
  const valueChange = sub(value, entryValue)
  const valueChangeDisplay =
    Number(valueChange) >= 0 ? (
      <Text className='d-flex align-item-center'>
        +
        {isShowValueInUsd(valueInUsdStatus, position?.pool) ? (
          '$'
        ) : (
          <TokenIcon tokenAddress={position?.pool?.TOKEN_R} size={16} />
        )}
        {formatLocalisedCompactNumber(formatFloat(valueChange))}
      </Text>
    ) : (
      <Text className='d-flex align-item-center'>
        -
        {isShowValueInUsd(valueInUsdStatus, position?.pool) ? (
          '$'
        ) : (
          <TokenIcon tokenAddress={position?.pool?.TOKEN_R} size={16} />
        )}
        {formatLocalisedCompactNumber(-formatFloat(valueChange))}{' '}
      </Text>
    )
  const pnl = div(valueChange, entryValue)

  if (isPhone) {
    return Number(pnl) >= 0 ? (
      <TextBuy className='pnl'>
        (+{formatPercent(pnl)}%)&nbsp;{valueChangeDisplay}
      </TextBuy>
    ) : (
      <TextSell className='pnl'>
        ({formatPercent(pnl)}%)&nbsp;{valueChangeDisplay}
      </TextSell>
    )
  }
  return Number(pnl) >= 0 ? (
    <TextBuy className='pnl'>
      {valueChangeDisplay}&nbsp;(+{formatPercent(pnl)}%)
    </TextBuy>
  ) : (
    <TextSell className='pnl'>
      {valueChangeDisplay}&nbsp;({formatPercent(pnl)}%)
    </TextSell>
  )
}

export const ClosingFee = ({
  now,
  position,
  isPhone
}: {
  now: number
  position: Position
  isPhone?: boolean
}) => {
  const res: any = position.closingFee(now)

  if (!res?.fee) {
    return <React.Fragment />
  }

  const TextComp = res?.isVesting ? TextSell : TextWarning
  const feeFormat = formatPercent(Math.min(1, res.fee ?? 0), 2, true)
  const timeFormat = moment.unix(res.remain ?? 0).from(0, true)

  if (isPhone) {
    return (
      <div>
        <TextComp>
          {feeFormat}% for {timeFormat}
        </TextComp>
      </div>
    )
  }
  return (
    <div>
      <div>
        <TextComp>{feeFormat}%</TextComp>
      </div>
      <div>
        <TextComp>for {timeFormat}</TextComp>
      </div>
    </div>
  )
}

export const Reserve = ({ pool }: { pool: any }) => {
  const { tokens } = useListTokens()
  const { width } = useWindowSize()
  const isPhone = width && width < 992

  return (
    <div className='d-flex gap-05 align-items-center'>
      <TokenIcon size={isPhone ? 18 : 24} tokenAddress={pool.TOKEN_R} />
      <Text>{tokens[pool.TOKEN_R]?.symbol}</Text>
    </div>
  )
}

export const ExplorerLink = ({ poolAddress }: { poolAddress: string }) => {
  const { configs } = useConfigs()

  return (
    <TextLink href={configs.explorer + '/address/' + poolAddress}>
      {shortenAddressString(poolAddress)}
    </TextLink>
  )
}

export const Token = ({
  token,
  balance
}: {
  token: string
  balance?: string
}) => {
  const { width } = useWindowSize()
  const isPhone = width && width < 992

  return (
    <div className='d-flex gap-05 align-items-center'>
      <TokenIcon size={isPhone ? 18 : 24} tokenAddress={token} />
      <div>
        <div>
          <TokenSymbol token={token} />
        </div>
        {!balance || (
          <div>
            <Text>{balance}</Text>
          </div>
        )}
      </div>
    </div>
  )
}

const isShowValueInUsd = (
  valueInUsdStatus: VALUE_IN_USD_STATUS,
  pool: PoolType
) => {
  return (
    valueInUsdStatus === VALUE_IN_USD_STATUS.USD ||
    (valueInUsdStatus === VALUE_IN_USD_STATUS.AUTO &&
      pool?.baseToken === pool?.TOKEN_R)
  )
}
