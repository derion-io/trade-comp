import { BigNumber } from 'ethers'
import _ from 'lodash'
import moment from 'moment'
import React, { useEffect, useMemo, useState } from 'react'
import { useWindowSize } from '../../hooks/useWindowSize'
import { useConfigs } from '../../state/config/useConfigs'
import { useHelper } from '../../state/config/useHelper'
import { useCurrentPool } from '../../state/currentPool/hooks/useCurrentPool'
import { useCurrentPoolGroup } from '../../state/currentPool/hooks/useCurrentPoolGroup'
import { useResource } from '../../state/resources/hooks/useResource'
import { PoolType } from '../../state/resources/type'
import { useSettings } from '../../state/setting/hooks/useSettings'
import { useListTokens } from '../../state/token/hook'
import { useWalletBalance } from '../../state/wallet/hooks/useBalances'
import { useSwapHistory } from '../../state/wallet/hooks/useSwapHistory'
import { POOL_IDS, POSITION_STATUS, TRADE_TYPE } from '../../utils/constant'
import formatLocalisedCompactNumber, {
  formatWeiToDisplayNumber
} from '../../utils/formatBalance'
import {
  IEW,
  mul,
  NUM,
  pow,
  calcPoolSide,
  decodeErc1155Address,
  div,
  encodeErc1155Address,
  formatFloat,
  formatPercent,
  isErc1155Address,
  oracleToPoolGroupId,
  shortenAddressString,
  sub,
  zerofy,
  STR,
  add,
  IS_NEG,
  ABS,
  poolToIndexID
} from '../../utils/helpers'
import { ClosingFeeCalculator, Position } from '../../utils/type'
import { ClosePosition } from '../ClosePositionModal'
import { useTokenValue } from '../SwapBox/hooks/useTokenValue'
import { Button, ButtonSell } from '../ui/Button'
import { InfoRow } from '../ui/InfoRow'
import {
  Text,
  TextBuy,
  TextError,
  TextGreen,
  TextGrey,
  TextLink,
  TextSell,
  TextWarning
} from '../ui/Text'
import { TokenIcon } from '../ui/TokenIcon'
import { TokenSymbol } from '../ui/TokenSymbol'
import './style.scss'
import { useSwapPendingHistory } from '../../state/wallet/hooks/useSwapPendingHistory'
import { SkeletonLoader } from '../ui/SkeletonLoader'
import { SharedPosition } from '../PositionSharedModal'
import { SharedIcon } from '../ui/Icon'
import { useTokenPrice } from '../../state/resources/hooks/useTokenPrice'

const mdp = require('move-decimal-point')

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
  const { tradeType, updateCurrentPoolGroup } = useCurrentPoolGroup()
  const { setCurrentPoolAddress } = useCurrentPool()
  const { pools, poolGroups } = useResource()
  const { balances, maturities } = useWalletBalance()
  const { tokens } = useListTokens()
  const { getTokenValue } = useTokenValue({})
  const { wrapToNativeAddress } = useHelper()
  const { settings } = useSettings()
  const [valueInUsdStatus, setValueInUsdStatus] = useState<VALUE_IN_USD_STATUS>(
    VALUE_IN_USD_STATUS.USD
  )
  const [visible, setVisible] = useState<boolean>(false)
  const [closingPosition, setClosingPosition] = useState<Position | undefined>(
    undefined
  )
  const [sharedPosition, setSharedPosition] = useState<Position | undefined>(
    undefined
  )
  const [outputTokenAddress, setOutputTokenAddress] = useState<string>('')
  const { ddlEngine } = useConfigs()
  const { swapLogs: sls } = useSwapHistory()
  const { swapPendingTxs } = useSwapPendingHistory()
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
    if (ddlEngine?.HISTORY && Object.values(pools).length > 0 && sls) {
      return (
        ddlEngine.HISTORY.generatePositions?.({
          tokens: Object.values(tokens),
          logs: _.cloneDeep(sls)
        }) ?? {}
      )
    }
    return {}
  }, [sls, pools, tokens, ddlEngine?.HISTORY])

  const generatePositionData = (
    poolAddress: string,
    side: number,
    pendingTxData?: { token: string }
  ): Position | null => {
    const pendingTxPool = decodeErc1155Address(pendingTxData?.token || '')
    const token = encodeErc1155Address(
      pendingTxData ? pendingTxPool.address : poolAddress,
      pendingTxData ? Number(pendingTxPool.id) : side
    )

    if (
      balances[token]?.gt(0) ||
      pendingTxData?.token ||
      positionsWithEntry[token]?.avgPrice
    ) {
      const pool =
        pools[pendingTxData?.token ? pendingTxPool.address : poolAddress]
      const posWithEntry = positionsWithEntry[token]
      const { avgPrice, avgPriceR, amountR } = posWithEntry ?? {}
      const entryPrice = avgPrice || -1
      const entryValueR = IEW(amountR || 1)
      const entryValueU = mul(entryValueR || 1, avgPriceR || 1)
      const valueR = getTokenValue(
        token,
        IEW(balances[token], tokens[token]?.decimals || 18),
        false
      )
      const valueU = getTokenValue(
        token,
        IEW(balances[token], tokens[token]?.decimals || 18),
        true
      )

      if (Number(valueU) < settings.minPositionValueUSD && !pendingTxData) {
        return null
      }

      const poolIndex = Object.keys(poolGroups).find(
        (index) => !!poolGroups?.[index]?.pools?.[poolAddress]
      )
      const currentPrice = poolGroups[poolIndex ?? '']?.basePrice ?? 0

      const { leverage, effectiveLeverage, dgA, dgB, funding } = calcPoolSide(
        pool,
        side,
        tokens,
        currentPrice
      )

      const sizeDisplay =
        side === POOL_IDS.A || side === POOL_IDS.B
          ? '$' +
            formatLocalisedCompactNumber(
              formatFloat(Number(valueU) * effectiveLeverage)
            )
          : ''

      const feeCalculator = new ClosingFeeCalculator({
        MATURITY: pool.MATURITY.toNumber(),
        MATURITY_VEST: pool.MATURITY_VEST.toNumber(),
        MATURITY_RATE: pool.MATURITY_RATE,
        maturity: maturities?.[token]?.toNumber() ?? 0
      })

      const L =
        side == POOL_IDS.A
          ? NUM(leverage)
          : side == POOL_IDS.B
          ? -NUM(leverage)
          : 0
      let valueRLinear
      let valueRCompound
      if (L != 0) {
        const priceRate = div(
          currentPrice,
          NUM(entryPrice) === 0 ? 1 : entryPrice
        )
        const leveragedPriceRate = add(
          1,
          div(mul(L, sub(currentPrice, entryPrice)), entryPrice)
        )
        if (leveragedPriceRate.startsWith('-')) {
          valueRLinear = '0'
        } else {
          valueRLinear = mul(entryValueR, leveragedPriceRate)
        }
        valueRCompound = mul(entryValueR, pow(priceRate, L))
      }

      return {
        poolAddress,
        currentPrice,
        pool,
        token,
        side,
        balance: balances[token],
        entryValueR,
        entryValueU,
        entryPrice,
        valueRLinear,
        valueRCompound,
        sizeDisplay,
        valueR,
        valueU,
        leverage,
        effectiveLeverage,
        dgA,
        dgB,
        funding,
        closingFee: (now?: number): any => {
          return feeCalculator.calculateFee(now)
        },
        status: POSITION_STATUS.OPENED
      }
    }
    return null
  }
  const generatePositionFromInput = (token: string): any => {
    if (!isErc1155Address(token)) return null
    const { address, id } = decodeErc1155Address(token)
    const s1 = {
      ...generatePositionData(address, Number(id), { token: token }),
      status: POSITION_STATUS.OPENING
    }
    return s1
  }
  const positions: Position[] = useMemo(() => {
    const result: any = []
    Object.keys(pools).forEach((poolAddress) => {
      result.push(generatePositionData(poolAddress, POOL_IDS.A))
      result.push(generatePositionData(poolAddress, POOL_IDS.B))
      result.push(generatePositionData(poolAddress, POOL_IDS.C))
    })

    return result.filter((r: any) => r !== null)
  }, [
    positionsWithEntry,
    balances,
    maturities,
    pools,
    settings.minPositionValueUSD
  ])

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
      const pendingPosition = swapPendingTxs
        .map((swapPendingTx) => {
          let isHaveTokenIn = false
          let isHaveTokenOut = false
          const { tokenIn, tokenOut } = swapPendingTx.steps?.[0]
          displayPositions.map((disPos, _) => {
            if (disPos.token === tokenIn) {
              disPos.status = POSITION_STATUS.CLOSING
              isHaveTokenIn = true
            }
            if (disPos.token === tokenOut) {
              disPos.status = POSITION_STATUS.UPDATING
              isHaveTokenOut = true
            }
          })
          if (!isHaveTokenIn && isErc1155Address(tokenIn)) {
            return generatePositionFromInput(tokenIn)
          }
          if (!isHaveTokenOut && isErc1155Address(tokenOut)) {
            return generatePositionFromInput(tokenOut)
          }
          return null
        })
        .filter((p) => p !== null)
      if (pendingPosition) {
        displayPositions = [...pendingPosition, ...displayPositions]
      }
    }

    const hasClosingFee = displayPositions.some(
      (p) => p?.closingFee?.(now)?.fee > 0
    )
    return [displayPositions, hasClosingFee]
  }, [positions, tradeType, swapPendingTxs])

  const showSize = tradeType !== TRADE_TYPE.LIQUIDITY

  return (
    <div className='positions-box'>
      {isPhone ? (
        <div className='positions-list'>
          {displayPositions.map((position, key: number) => {
            return (
              <div className='positions-list__item' key={key}>
                <InfoRow>
                  <Token token={position.token} />
                  <ButtonSell
                    size='small'
                    className='share-position'
                    style={{ border: 'none' }}
                    onClick={(e) => {
                      setSharedPosition(position)
                      e.stopPropagation()
                    }}
                  >
                    <SharedIcon />
                  </ButtonSell>
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

                {Number?.(position?.entryPrice) > 0 ? (
                  <InfoRow>
                    <TextGrey>Entry Price</TextGrey>
                    <EntryPrice
                      position={position}
                      loading={position.status === POSITION_STATUS.OPENING}
                      isPhone
                    />
                  </InfoRow>
                ) : (
                  ''
                )}

                <InfoRow>
                  <TextGrey>
                    Net Value
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
                  </TextGrey>
                  <NetValue
                    position={position}
                    valueInUsdStatus={valueInUsdStatus}
                    loading={position.status === POSITION_STATUS.OPENING}
                    isPhone
                  />
                </InfoRow>
                {Number(position.entryPrice) > 0 ? (
                  position.valueRCompound ? (
                    <React.Fragment>
                      <InfoRow>
                        <TextGrey>PnL</TextGrey>
                        <LinearPnL
                          valueInUsdStatus={valueInUsdStatus}
                          position={position}
                          loading={position.status === POSITION_STATUS.OPENING}
                          isPhone
                        />
                      </InfoRow>
                      <InfoRow>
                        <TextGrey>Compound</TextGrey>
                        <CompoundPnL
                          valueInUsdStatus={valueInUsdStatus}
                          position={position}
                          loading={position.status === POSITION_STATUS.OPENING}
                          isPhone
                        />
                      </InfoRow>
                      <InfoRow>
                        <TextGrey>Funding</TextGrey>
                        <Funding
                          valueInUsdStatus={valueInUsdStatus}
                          position={position}
                          loading={position.status === POSITION_STATUS.OPENING}
                          isPhone
                        />
                      </InfoRow>
                    </React.Fragment>
                  ) : (
                    <React.Fragment>
                      <InfoRow>
                        <TextGrey>PnL</TextGrey>
                        <PnL
                          valueInUsdStatus={valueInUsdStatus}
                          position={position}
                          loading={position.status === POSITION_STATUS.OPENING}
                          isPhone
                        />
                      </InfoRow>
                    </React.Fragment>
                  )
                ) : (
                  ''
                )}

                {!position.funding || (
                  <InfoRow>
                    <TextGrey>
                      {position.side === POOL_IDS.C
                        ? 'Funding Yield'
                        : 'Funding Rate'}
                    </TextGrey>
                    <FundingRate position={position} />
                  </InfoRow>
                )}

                {!showSize || !position.sizeDisplay || (
                  <InfoRow>
                    <TextGrey>Size</TextGrey>
                    <Size position={position} isPhone />
                  </InfoRow>
                )}
                <InfoRow>
                  <TextGrey>Deleverage Price</TextGrey>
                  <DeleveragePrice position={position} isPhone />
                </InfoRow>

                {!position?.closingFee?.(now)?.fee || (
                  <InfoRow>
                    <TextGrey>Closing Fee</TextGrey>
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
                  {position.status === POSITION_STATUS.OPENING ? (
                    <ButtonSell
                      className='btn-close'
                      size='small'
                      style={{ opacity: 0.5 }}
                      disabled
                    >
                      Pending...
                    </ButtonSell>
                  ) : (
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
                  )}
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
              <th>Entry Price</th>
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
              <th>Funding</th>
              {showSize && <th>Size</th>}
              <th>Delev. Price</th>
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
                    const pool = pools[position.poolAddress]
                    if (pool?.ORACLE?.length) {
                      updateCurrentPoolGroup(poolToIndexID(pool))
                    }
                    if (tradeType === TRADE_TYPE.SWAP) {
                      setOutputTokenAddressToBuy(position.token)
                    } else {
                      const { address } = decodeErc1155Address(position.token)
                      const side =
                        tradeType === TRADE_TYPE.LONG
                          ? POOL_IDS.A
                          : tradeType === TRADE_TYPE.SHORT
                          ? POOL_IDS.B
                          : POOL_IDS.C
                      setCurrentPoolAddress(address)
                      setOutputTokenAddressToBuy(
                        encodeErc1155Address(address, side)
                      )
                    }
                  }}
                  key={key}
                >
                  <td>
                    <Token
                      token={position.token}
                      doubleLines
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
                    <SkeletonLoader
                      loading={position.status === POSITION_STATUS.OPENING}
                    >
                      {Number?.(position?.entryPrice) > 0 ? (
                        <EntryPrice
                          position={position}
                          loading={position.status === POSITION_STATUS.OPENING}
                        />
                      ) : (
                        ''
                      )}
                    </SkeletonLoader>
                  </td>
                  <td>
                    <div className='net-value-and-pnl'>
                      <NetValue
                        position={position}
                        valueInUsdStatus={valueInUsdStatus}
                        loading={position.status === POSITION_STATUS.OPENING}
                      />
                      {Number?.(position.entryPrice) > 0 ? (
                        position.valueRCompound ? (
                          <CompoundPnL
                            loading={
                              position.status === POSITION_STATUS.OPENING
                            }
                            valueInUsdStatus={valueInUsdStatus}
                            position={position}
                          />
                        ) : (
                          <PnL
                            loading={
                              position.status === POSITION_STATUS.OPENING
                            }
                            valueInUsdStatus={valueInUsdStatus}
                            position={position}
                          />
                        )
                      ) : (
                        ''
                      )}
                    </div>
                  </td>
                  <td>
                    <FundingRate position={position} />
                    {!position.valueRCompound || (
                      <Funding
                        valueInUsdStatus={valueInUsdStatus}
                        position={position}
                        loading={position.status === POSITION_STATUS.OPENING}
                      />
                    )}
                  </td>
                  {!showSize || (
                    <td>
                      <Size position={position} />
                    </td>
                  )}
                  <td>
                    <DeleveragePrice position={position} />
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
                      className='share-position'
                      style={{ border: 'none' }}
                      onClick={(e) => {
                        setSharedPosition(position)
                        e.stopPropagation()
                      }}
                    >
                      <SharedIcon />
                    </ButtonSell>
                    {position.status === POSITION_STATUS.OPENING ? (
                      <ButtonSell
                        disabled
                        size='small'
                        style={{ opacity: 0.5 }}
                      >
                        Pending
                      </ButtonSell>
                    ) : position.status === POSITION_STATUS.CLOSING ? (
                      <ButtonSell
                        size='small'
                        disabled
                        style={{ opacity: 0.5 }}
                      >
                        <SkeletonLoader
                          textLoading={
                            position.side === POOL_IDS.C
                              ? 'Removing'
                              : 'Closing'
                          }
                          loading={position.status === POSITION_STATUS.CLOSING}
                        />
                      </ButtonSell>
                    ) : (
                      <ButtonSell
                        size='small'
                        onClick={(e) => {
                          setClosingPosition(position)
                          setOutputTokenAddress(
                            wrapToNativeAddress(position.pool.TOKEN_R)
                          )
                          setVisible(true)
                          e.stopPropagation() // stop the index from being changed
                        }}
                      >
                        {position.side === POOL_IDS.C ? 'Remove' : 'Close'}
                      </ButtonSell>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
      {sharedPosition != null && Number?.(sharedPosition.entryPrice) > 0 ? (
        <SharedPosition
          visible={sharedPosition != null}
          setVisible={() => {
            setSharedPosition(undefined)
          }}
          position={sharedPosition}
        />
      ) : (
        ''
      )}
      {visible && closingPosition != null ? (
        <ClosePosition
          visible={visible}
          setVisible={setVisible}
          position={closingPosition}
          outputTokenAddress={outputTokenAddress}
          setOutputTokenAddress={setOutputTokenAddress}
          tokenOutMaturity={tokenOutMaturity}
          valueInUsdStatus={valueInUsdStatus}
          setValueInUsdStatus={setValueInUsdStatus}
          title={
            Number(decodeErc1155Address(closingPosition.token).id) ===
            POOL_IDS.C ? (
              <Text>
                Remove{' '}
                <TokenSymbol token={closingPosition.token} textWrap={Text} />{' '}
              </Text>
            ) : (
              <Text>
                Close{' '}
                <TokenSymbol token={closingPosition.token} textWrap={Text} />{' '}
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

export const EntryPrice = ({
  position,
  isPhone,
  loading
}: {
  position: Position
  isPhone?: boolean
  loading?: boolean
}) => {
  if (loading) return <SkeletonLoader loading/>

  const { entryPrice, currentPrice } = position
  const priceRate = div(sub(currentPrice, entryPrice), entryPrice)
  const rateDisplay = priceRate > 0
    ? <TextBuy>+{formatFloat(mdp(priceRate, 2), undefined, 3, true)}%</TextBuy>
    : <TextSell>{formatFloat(mdp(priceRate, 2), undefined, 3, true)}%</TextSell>

  if (isPhone) {
    return <Text>
      <TextGrey>{zerofy(formatFloat(entryPrice))}</TextGrey>
      &nbsp;
      {rateDisplay}
    </Text>
  }

  return <React.Fragment>
    <div><TextGrey>{zerofy(formatFloat(entryPrice))}</TextGrey></div>
    <div>{rateDisplay}</div>
  </React.Fragment>
}

export const NetValue = ({
  position,
  valueInUsdStatus,
  isPhone,
  loading
}: {
  position: {
    pool: PoolType,
    valueR: string,
    valueU: string,
    entryValueR?: string,
    entryValueU?: string,
  }
  loading?: boolean
  valueInUsdStatus: VALUE_IN_USD_STATUS
  isPhone?: boolean
}) => {
  if (loading) return <SkeletonLoader loading/>
  const { pool, valueR, valueU, entryValueR, entryValueU } = position
  const [from, to] = isShowValueInUsd(valueInUsdStatus, pool)
    ? [entryValueU, valueU]
    : [entryValueR, valueR]

  const fromCurrency = isShowValueInUsd(valueInUsdStatus, pool)
    ? <TextGrey>$</TextGrey>
    : <TokenIcon tokenAddress={pool?.TOKEN_R} size={16} iconSize='1.4ex'/>

  const toCurrency = isShowValueInUsd(valueInUsdStatus, pool)
    ? <Text>$</Text>
    : <TokenIcon tokenAddress={pool?.TOKEN_R} size={16} iconSize='1.4ex'/>

  return (
    <div className='d-flex align-item-center'>
      {from && <React.Fragment>
        {fromCurrency}
        <TextGrey>{zerofy(NUM(from))}</TextGrey>
        <TextGrey className='mr-05 ml-05'>→</TextGrey>
      </React.Fragment>}
      {toCurrency}
      <Text>{zerofy(NUM(to))}</Text>
    </div>
  )
}

export const LinearPnL = ({
  position,
  isPhone,
  valueInUsdStatus,
  loading
}: {
  position: Position
  isPhone?: boolean
  loading?:boolean
  valueInUsdStatus: VALUE_IN_USD_STATUS
}) => {
  if (loading) return <SkeletonLoader loading/>
  const { pool, valueRLinear, entryValueU, entryValueR } = position
  const { prices } = useTokenPrice()
  const priceR = prices[pool.TOKEN_R] ?? 1
  const valueULinear = mul(valueRLinear, priceR)
  const [value, entryValue] = isShowValueInUsd(valueInUsdStatus, pool)
    ? [valueULinear, entryValueU]
    : [valueRLinear, entryValueR]
  if (!entryValue || !Number(entryValue)) {
    return <React.Fragment />
  }
  const valueChange = sub(value, entryValue)
  const valueChangeDisplay =
    <Text className='d-flex align-item-center'>
      {IS_NEG(valueChange) ? '-' : '+'}
      {isShowValueInUsd(valueInUsdStatus, pool) ? '$' : <TokenIcon tokenAddress={pool?.TOKEN_R} size={16} iconSize='1.4ex' />}
      {zerofy(ABS(valueChange))}
    </Text>
  const rate = formatPercent(div(valueChange, entryValue), undefined, true)
  if (rate == 0) {
    return <React.Fragment />
  }
  const rateDisplay = rate <= -99.9 ? 'LIQUIDATED' : ((rate >= 0 ? '+' : '') + STR(rate) + '%')
  const TextComp = rate >= 0 ? TextBuy : TextSell
  if (isPhone) {
    return <TextComp className='pnl'>
      ({rateDisplay})&nbsp;{valueChangeDisplay}
    </TextComp>
  }
  return <TextComp className='pnl'>
    {valueChangeDisplay}&nbsp;({rateDisplay})
  </TextComp>
}

// export const CompoundToLinearPnL = ({
//   position,
//   isPhone,
//   valueInUsdStatus,
//   loading
// }: {
//   position: Position
//   isPhone?: boolean
//   loading?:boolean
//   valueInUsdStatus: VALUE_IN_USD_STATUS
// }) => {
//   if (loading) return <SkeletonLoader loading/>
//   const { pool, valueRCompound, valueRLinear } = position
//   const { prices } = useTokenPrice()
//   const priceR = prices[pool.TOKEN_R] ?? 1
//   const valueUCompound = mul(valueRCompound, priceR)
//   const valueULinear = mul(valueRLinear, priceR)
//   const [value, entryValue] = isShowValueInUsd(valueInUsdStatus, pool)
//     ? [valueUCompound, valueULinear]
//     : [valueRCompound, valueRLinear]
//   const valueChange = sub(value, entryValue)
//   const valueChangeDisplay =
//     <Text className='d-flex align-item-center'>
//       {IS_NEG(valueChange) ? '-' : '+'}
//       {isShowValueInUsd(valueInUsdStatus, pool) ? '$' : <TokenIcon tokenAddress={pool?.TOKEN_R} size={16} iconSize='1.4ex' />}
//       {zerofy(ABS(valueChange))}
//     </Text>
//   const maxValue = Math.max(NUM(value ?? 0), NUM(entryValue ?? 0))
//   if (maxValue == 0) {
//     return <React.Fragment/>
//   }
//   const rate = formatPercent(div(valueChange, maxValue), undefined, true)
//   const rateDisplay = (rate >= 0 ? '+' : '') + STR(rate)
//   const TextComp = rate >= 0 ? TextBuy : TextSell
//   if (isPhone) {
//     return <TextComp className='pnl'>
//       ({rateDisplay}%)&nbsp;{valueChangeDisplay}
//     </TextComp>
//   }
//   return <TextComp className='pnl'>
//     {valueChangeDisplay}&nbsp;({rateDisplay}%)
//   </TextComp>
// }

export const CompoundPnL = ({
  position,
  isPhone,
  valueInUsdStatus,
  loading
}: {
  position: Position
  isPhone?: boolean
  loading?:boolean
  valueInUsdStatus: VALUE_IN_USD_STATUS
}) => {
  if (loading) return <SkeletonLoader loading/>
  const { pool, valueRCompound, entryValueU, entryValueR } = position
  const { prices } = useTokenPrice()
  const priceR = prices[pool.TOKEN_R] ?? 1
  const valueUCompound = mul(valueRCompound, priceR)
  const [value, entryValue] = isShowValueInUsd(valueInUsdStatus, pool)
    ? [valueUCompound, entryValueU]
    : [valueRCompound, entryValueR]
  const valueChange = sub(value, entryValue)
  const valueChangeDisplay =
    <Text className='d-flex align-item-center'>
      {IS_NEG(valueChange) ? '-' : '+'}
      {isShowValueInUsd(valueInUsdStatus, pool) ? '$' : <TokenIcon tokenAddress={pool?.TOKEN_R} size={16} iconSize='1.4ex' />}
      {zerofy(ABS(valueChange))}
    </Text>
  const rate = formatPercent(div(valueChange, entryValue), undefined, true)
  const rateDisplay = (rate >= 0 ? '+' : '') + STR(rate)
  const TextComp = rate >= 0 ? TextBuy : TextSell
  if (isPhone) {
    return <TextComp className='pnl'>
      ({rateDisplay}%)&nbsp;{valueChangeDisplay}
    </TextComp>
  }
  return <TextComp className='pnl'>
    {valueChangeDisplay}&nbsp;({rateDisplay}%)
  </TextComp>
}

export const PnL = ({
  position,
  isPhone,
  valueInUsdStatus,
  loading
}: {
  position: Position
  isPhone?: boolean
  loading?:boolean
  valueInUsdStatus: VALUE_IN_USD_STATUS
}) => {
  if (loading) return <SkeletonLoader loading/>
  const { pool, entryValueU, entryValueR, valueR, valueU } = position
  const [value, entryValue] = isShowValueInUsd(valueInUsdStatus, pool)
    ? [valueU, entryValueU]
    : [valueR, entryValueR]
  const valueChange = sub(value, entryValue)
  const valueChangeDisplay =
    <Text className='d-flex align-item-center'>
      {IS_NEG(valueChange) ? '-' : '+'}
      {isShowValueInUsd(valueInUsdStatus, pool) ? '$' : <TokenIcon tokenAddress={pool?.TOKEN_R} size={16} iconSize='1.4ex' />}
      {zerofy(ABS(valueChange))}
    </Text>
  const maxValue = Math.max(NUM(value ?? 0), NUM(entryValue ?? 0))
  if (maxValue == 0) {
    return <React.Fragment/>
  }
  const rate = formatPercent(div(valueChange, maxValue), undefined, true)
  const rateDisplay = (rate >= 0 ? '+' : '') + STR(rate)
  const TextComp = rate >= 0 ? TextBuy : TextSell
  if (isPhone) {
    return <TextComp className='pnl'>
      ({rateDisplay}%)&nbsp;{valueChangeDisplay}
    </TextComp>
  }
  return <TextComp className='pnl'>
    {valueChangeDisplay}&nbsp;({rateDisplay}%)
  </TextComp>
}

export const Funding = ({
  position,
  isPhone,
  valueInUsdStatus,
  loading
}: {
  position: Position
  isPhone?: boolean
  loading?:boolean
  valueInUsdStatus: VALUE_IN_USD_STATUS
}) => {
  if (loading) return <SkeletonLoader loading/>
  const { pool, valueR, valueRCompound, valueU } = position
  const { prices } = useTokenPrice()
  const priceR = prices[pool.TOKEN_R] ?? 1
  const paidR = NUM(sub(valueR, valueRCompound))

  let valueChangeDisplay
  let rate

  if (isShowValueInUsd(valueInUsdStatus, pool)) {
    const compoundValueU = mul(valueRCompound, priceR)
    const paidU = NUM(sub(valueU, compoundValueU))
    valueChangeDisplay = <Text className='d-flex align-item-center'>
      {paidU >= 0 ? '+$' : '-$'}
      {zerofy(Math.abs(paidU))}
    </Text>
    rate = div(paidU, compoundValueU)
  } else {
    valueChangeDisplay = <Text className='d-flex align-item-center'>
      {paidR > 0 ? '+' : '-'}
      <TokenIcon tokenAddress={pool?.TOKEN_R} size={16} iconSize='1.4ex' />
      {zerofy(Math.abs(paidR))}
    </Text>
    rate = div(paidR, valueRCompound)
  }

  if (paidR == 0) {
    return <React.Fragment />
  }

  if (!isPhone) {
    return paidR >= 0 ? (
      <TextBuy>
        {valueChangeDisplay}
      </TextBuy>
    ) : (
      <TextSell>
        {valueChangeDisplay}
      </TextSell>
    )
  }

  const rateDisplay = formatPercent(rate)
  return paidR >= 0 ? (
    <TextBuy className='pnl'>
      (+{rateDisplay}%)&nbsp;{valueChangeDisplay}
    </TextBuy>
  ) : (
    <TextSell className='pnl'>
      ({rateDisplay}%)&nbsp;{valueChangeDisplay}
    </TextSell>
  )
}

export const DeleveragePrice = ({
  position,
  isPhone
}: {
  position: {
    dgA: number
    dgB: number
    currentPrice?: string
    side: number
    effectiveLeverage: number
    leverage: number
  }
  isPhone?: boolean
}) => {
  const { dgA, dgB, currentPrice, side, effectiveLeverage, leverage } = position

  const deltas = [dgA, dgB].map(dg => {
    if (currentPrice == null) {
      return ''
    }
    const rate = NUM(div(dg, currentPrice))
    if (rate >= 2) {
      return `(×${formatFloat(rate, undefined, 2, true)})`
    }
    if (rate <= 0.5) {
      return `(1/${formatFloat(1 / rate, undefined, 2, true)})`
    }
    const delta = formatFloat(mdp(div(sub(dg, currentPrice), currentPrice), 2), undefined, 3, true)
    return `(${delta >= 0 ? '+' : ''}${delta}%)`
  })

  const TextComp =
    effectiveLeverage < leverage / 2 ? TextSell
      : effectiveLeverage < leverage ? TextWarning
        : TextGrey

  if (isPhone) {
    return side === POOL_IDS.A
      ? <TextComp>{deltas[0]} {zerofy(dgA)}</TextComp>
      : side === POOL_IDS.B ? <TextComp>{deltas[1]} {zerofy(dgB)}</TextComp>
        : <TextComp>{zerofy(dgB)}-{zerofy(dgA)}</TextComp>
  }

  return side === POOL_IDS.A
    ? <React.Fragment>
      <div><TextComp>{zerofy(dgA)}</TextComp></div>
      <TextComp>{deltas[0]}</TextComp>
    </React.Fragment>
    : side === POOL_IDS.B ? <React.Fragment>
      <div><TextComp>{zerofy(dgB)}</TextComp></div>
      <TextComp>{deltas[1]}</TextComp>
    </React.Fragment>
      : <React.Fragment>
        <div><TextComp>{zerofy(dgA)}</TextComp></div>
        <TextComp>{zerofy(dgB)}</TextComp>
      </React.Fragment>
}

export const FundingRate = ({
  position
}: {
  position: Position
}) => {
  const { side, funding } = position
  const TextComp = funding < 0 || side === POOL_IDS.C ? TextGreen : TextWarning
  const fundingFormat = zerofy(formatFloat(funding * 100, undefined, 3, true))
  if (fundingFormat == '0') {
    return <React.Fragment />
  }
  return <TextComp>
    {fundingFormat}%
    <TextGrey>/24h</TextGrey>
  </TextComp>
}

export const Size = ({
  position,
  isPhone
}: {
  position: Position
  isPhone?: boolean
}) => {
  const { status, leverage, effectiveLeverage, sizeDisplay } = position
  if (!sizeDisplay) {
    return <React.Fragment/>
  }
  if (!isPhone) {
    return <SkeletonLoader loading={status === POSITION_STATUS.OPENING}>
      {effectiveLeverage < leverage / 2
        ? <TextError>{sizeDisplay}
          <div><TextGrey>({leverage}x)</TextGrey></div>
        </TextError>
        : effectiveLeverage < leverage
          ? <TextWarning>{sizeDisplay}
            <div><TextGrey>({leverage}x)</TextGrey></div>
          </TextWarning>
          : <TextGrey>{sizeDisplay}
            <div><TextGrey>({leverage}x)</TextGrey></div>
          </TextGrey>
      }
    </SkeletonLoader>
  }
  return <SkeletonLoader loading={status === POSITION_STATUS.OPENING}>
    {effectiveLeverage < leverage / 2 ? (
      <TextError>
        ({leverage}x) {sizeDisplay}
      </TextError>
    ) : effectiveLeverage < leverage ? (
      <TextWarning>
        ({leverage}x) {sizeDisplay}
      </TextWarning>
    ) : (
      <TextGrey>
        ({leverage}x) {sizeDisplay}
      </TextGrey>
    )}
  </SkeletonLoader>
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
  if (!position?.closingFee?.()) return <React.Fragment />
  const res: any = position.closingFee(now)

  if (!res?.fee) {
    return <React.Fragment />
  }

  const TextComp = res?.isVesting ? TextSell : TextWarning
  const feeFormat = formatPercent(Math.min(1, res.fee ?? 0), 2, true)
  const timeFormat = moment.unix(res.remain ?? 0).from(0, true)
  const { status } = position
  if (isPhone) {
    return (
      <div>
        <SkeletonLoader loading={status !== POSITION_STATUS.OPENED} >
          <TextComp>
            {feeFormat}% for {timeFormat}
          </TextComp>
        </SkeletonLoader>
      </div>
    )
  }
  return (
    <div>
      {status !== POSITION_STATUS.UPDATING
        ? <div>
          <SkeletonLoader loading={status === POSITION_STATUS.OPENING} >
            <div>
              <TextComp>{feeFormat}%</TextComp>
            </div>
          </SkeletonLoader>
          <SkeletonLoader loading={status === POSITION_STATUS.OPENING} >
            <div>
              <TextComp>{`for ${timeFormat}`}</TextComp>
            </div>
          </SkeletonLoader>
        </div>
        : <SkeletonLoader height='26px' textLoading='Updating' loading={status === POSITION_STATUS.UPDATING} >
          <TextComp>{`for ${timeFormat}`}</TextComp>
        </SkeletonLoader>
      }
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
  balance,
  doubleLines
}: {
  token: string
  balance?: string
  doubleLines?: boolean
}) => {
  const { width } = useWindowSize()
  const isPhone = width && width < 992
  doubleLines = !!doubleLines && !balance && !isPhone

  return (
    <div className='d-flex gap-05 align-items-center'>
      <TokenIcon size={isPhone ? 18 : 24} tokenAddress={token} />
      <div>
        <div>
          <TokenSymbol token={token} only={doubleLines ? 'type' : undefined} />
        </div>
        {!doubleLines || <div><TokenSymbol token={token} only='index' /></div>}
        {!balance || <div><Text>{balance}</Text></div>}
      </div>
    </div>
  )
}

export const isShowValueInUsd = (
  valueInUsdStatus: VALUE_IN_USD_STATUS,
  pool: PoolType
) => {
  return (
    valueInUsdStatus === VALUE_IN_USD_STATUS.USD ||
    (valueInUsdStatus === VALUE_IN_USD_STATUS.AUTO &&
      pool?.baseToken === pool?.TOKEN_R)
  )
}
