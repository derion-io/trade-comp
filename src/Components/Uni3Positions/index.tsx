import { BigNumber } from 'ethers'
import _ from 'lodash'
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
import { formatLocalisedCompactNumber } from '../../utils/formatBalance'
import {
  IEW,
  mul,
  NUM,
  pow,
  calcPoolSide,
  decodeErc1155Address,
  div,
  encodeErc1155Address,
  formatMaturity,
  formatFloat,
  formatPercent,
  isErc1155Address,
  shortenAddressString,
  sub,
  zerofy,
  STR,
  add,
  IS_NEG,
  ABS,
  poolToIndexID,
  bn,
  calculatePx
} from '../../utils/helpers'
import { ClosingFeeCalculator, Position } from '../../utils/type'
import { ClosePosition } from '../ClosePositionModal'
import { useTokenValue } from '../SwapBox/hooks/useTokenValue'
import { ButtonSell } from '../ui/Button'
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
import { SkeletonLoader } from '../ui/SkeletonLoader'
import { SharedPosition } from '../PositionSharedModal'
import { SharedIcon } from '../ui/Icon'
import { useTokenPrice } from '../../state/resources/hooks/useTokenPrice'
import { BatchTransferModal } from '../BatchTransfer'
import { Checkbox } from 'antd'
import { useWeb3React } from '../../state/customWeb3React/hook'
import { Q128 } from 'derivable-engine/dist/services/resource'
import { PositionLoadingComponent } from '../BuyPositionBox/components/PositionLoading'
import { useUni3Position } from '../../state/uni3Positions/hooks/useUni3Positions'
import { CurrencyGroupLogo } from '../ui/CurrencyGroupLogo'

const mdp = require('move-decimal-point')

export enum VALUE_IN_USD_STATUS {
  AUTO,
  USD,
  TOKEN_R
}

export const Uni3Positions = ({
  setOutputTokenAddressToBuy,
  tokenOutMaturity,
  isLoadingIndex
}: {
  setOutputTokenAddressToBuy: any
  tokenOutMaturity: BigNumber
  isLoadingIndex: boolean
}) => {
  const { tradeType, updateCurrentPoolGroup } = useCurrentPoolGroup()
  const { setCurrentPoolAddress } = useCurrentPool()
  const { pools, poolGroups } = useResource()
  const { balances, maturities, swapLogs, swapPendingTxs, positionsWithEntry } =
    useWalletBalance()
  const { tokens } = useListTokens()
  const { getTokenValue } = useTokenValue({})
  const { wrapToNativeAddress } = useHelper()
  const { prices } = useTokenPrice()
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
  const [selections, setSelections] = useState<{ [pos: string]: Position }>({})
  const [outputTokenAddress, setOutputTokenAddress] = useState<string>('')
  const { ddlEngine } = useConfigs()
  const { updatePositionsWithEntry } = useSwapHistory()
  // const { } = useSwapPendingHistory()
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
  const { account } = useWeb3React()
  // const [positionsWithEntry, setPositionsWithEntry] = useState<{[key:string]: any}>({})
  const [positions, setPositions] = useState<Position[]>([])

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
    // check for position with entry
    if (
      (pendingTxData?.token || positionsWithEntry[token]?.avgPrice) &&
      positionsWithEntry[token]?.entryPrice !== -1
    ) {
      const pool =
        pools[pendingTxData?.token ? pendingTxPool.address : poolAddress]
      const posWithEntry = positionsWithEntry[token]
      let { avgPrice, avgPriceR, amountR } = posWithEntry ?? {}
      if (!pool.OPEN_RATE.eq(Q128)) {
        // reduce the input value by the open rate
        amountR = amountR?.mul(pool.OPEN_RATE).div(Q128)
      }
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

      if (!balances?.[token]?.gt(0)) {
        return null
      }
      if (!(prices[pool.TOKEN_R] ?? 0)) {
        return null
      }
      if (
        !isLoadingIndex &&
        Number(valueU) < settings.minPositionValueUSD &&
        !pendingTxData
      ) {
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
        // if (leveragedPriceRate.startsWith('-')) {
        //   valueRLinear = '0'
        // } else {
        valueRLinear = mul(entryValueR, leveragedPriceRate)
        // }
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
        calulateClosingFee: (now?: number): any => {
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
  useEffect(() => {
    setPositions([])
  }, [account])
  useEffect(() => {
    if (ddlEngine?.HISTORY && swapLogs && swapLogs?.[0]?.args[0] === account) {
      updatePositionsWithEntry(
        account,
        ddlEngine.HISTORY.generatePositions?.({
          tokens: Object.values(tokens),
          logs: _.cloneDeep(swapLogs)
        }) ?? {}
      )
    }
  }, [swapLogs, tokens, ddlEngine?.HISTORY, account])

  useEffect(() => {
    if (Object.keys(positionsWithEntry)?.length !== 0) {
      const result: any[] = []
      Object.keys(pools).forEach((poolAddress) => {
        result.push(generatePositionData(poolAddress, POOL_IDS.A))
        result.push(generatePositionData(poolAddress, POOL_IDS.B))
        result.unshift(generatePositionData(poolAddress, POOL_IDS.C))
      })
      setPositions(result.filter((r: any) => r !== null))
    }
  }, [
    positionsWithEntry,
    pools,
    isLoadingIndex,
    prices,
    balances,
    tokens,
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
      (p) => p?.calulateClosingFee?.(now)?.fee > 0
    )
    return [displayPositions, hasClosingFee]
  }, [positions, tradeType, swapPendingTxs])
  const isShowAllPosition = useMemo(
    () => settings.minPositionValueUSD === 0,
    [settings.minPositionValueUSD]
  )
  const [isBatchTransferModalVisible, setBatchTransferModalVisible] =
    useState<boolean>(false)
  const showSize = tradeType !== TRADE_TYPE.LIQUIDITY

  const isFetchingPosition = useMemo(() => {
    if (displayPositions.length > 0) return false
    return account && isLoadingIndex
  }, [account, isLoadingIndex, displayPositions])

  const { currentUni3Position, uni3Positions, displayUni3Positions, setCurrentUni3Position} =
    useUni3Position()
  useEffect(() => {
    console.log('#uni3', displayUni3Positions)
  }, [displayUni3Positions])
  const [revertRange, setRevertRange] = useState<boolean>(false)
  return (
    <div className='positions-box'>
      {isBatchTransferModalVisible && (
        <BatchTransferModal
          visible={isBatchTransferModalVisible}
          setVisible={setBatchTransferModalVisible}
          selections={selections}
        />
      )}
      {/* {JSON.stringify(displayUni3Positions)} */}
      {isPhone ? (
        isFetchingPosition ? (
          <PositionLoadingComponent />
        ) : (
          <div className='positions-list'>
            {Object.keys(displayUni3Positions).map((posKey, key: number) => {
              const position = displayUni3Positions[posKey]
              return (
                <div className='positions-list__item' key={key}>
                  <InfoRow>
                    <TextGrey className='d-flex align-item-center'>
                      <TokenIcon
                        tokenAddress={position?.token0}
                        size={16}
                        iconSize='1.4ex'
                      />{' '}
                      {position.token0Data.symbol}/{' '}
                      <TokenIcon
                        tokenAddress={position?.token1}
                        size={16}
                        iconSize='1.4ex'
                      />{' '}
                      {position.token1Data.symbol}
                    </TextGrey>
                  </InfoRow>
                <InfoRow>
                  <TextGrey>Reserves</TextGrey>
                  <TextGrey className='d-flex align-item-center'>
                        <TokenIcon
                          tokenAddress={position?.token0}
                          size={16}
                          iconSize='1.4ex'
                        />
                        {zerofy(position.posLiquidityToken0)}
                        {' '} + {' '}<TokenIcon
                          tokenAddress={position?.token1}
                          size={16}
                          iconSize='1.4ex'
                        />
                        {zerofy(position.posLiquidityToken1)}
                      </TextGrey>
                </InfoRow>
                  <InfoRow>
                    <TextGrey>Size</TextGrey>
                    <div>
                      {/* <Text className='d-flex align-item-center'>
                        {zerofy(position.posLiquidityByBaseToken ?? bn(0))}{' '}
                        <TokenIcon
                          tokenAddress={position?.token0}
                          size={16}
                          iconSize='1.4ex'
                        />
                      </Text> */}

                      <Text className='d-flex align-item-center'>
                        ${zerofy(position.totalPositionByUSD ?? bn(0))}{' '}
                      </Text>
                    </div>
                  </InfoRow>

                  <InfoRow >
                    <TextGrey>Price Range <Text
                      className='text-link'
                      onClick={()=> {setRevertRange(!revertRange)}}
                    >
                      ⇄
                    </Text></TextGrey>
                    <React.Fragment>
                      {revertRange ? 
                      <TextGrey className='d-flex align-item-center'>
                        {zerofy(1/position.pxUpper)}
                        {'<-->'}
                        {zerofy(1 / position.pxLower)} (<TokenIcon
                          tokenAddress={position?.token0}
                          size={16}
                          iconSize='1.4ex'
                        />{' '}
                        /  <TokenIcon
                          tokenAddress={position?.token1}
                          size={16}
                          iconSize='1.4ex'
                        />)
                      </TextGrey> :  <TextGrey className='d-flex align-item-center'>
                        {zerofy(position.pxUpper)}
                        {'<-->'}
                        {zerofy(position.pxLower)} (<TokenIcon
                          tokenAddress={position?.token1}
                          size={16}
                          iconSize='1.4ex'
                        />{' '}
                        /  <TokenIcon
                          tokenAddress={position?.token0}
                          size={16}
                          iconSize='1.4ex'
                        />)
                  
                      </TextGrey>}
                    </React.Fragment>
                  </InfoRow>

                  {position.fee ? (
                    <InfoRow>
                      <TextGrey>Fee</TextGrey>
                      <Text>{Number(position.fee) / 1e4}%</Text>
                    </InfoRow>
                  ) : (
                    ''
                  )}

                  {/* <InfoRow>
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
                            tokens[wrapToNativeAddress(position?.pool?.TOKEN_R)]
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
                </InfoRow> */}
                  {/* {Number(position.entryPrice) > 0 ? (
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
                        <CompoundToLinearPnL
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
                )} */}

                  {/* {!position.funding || (
                  <InfoRow>
                    <TextGrey>
                      {position.side === POOL_IDS.C
                        ? 'Funding Yield'
                        : 'Funding Rate'}
                    </TextGrey>
                    <FundingRate position={position} />
                  </InfoRow>
                )} */}

                  {/* <InfoRow>
                  <TextGrey>Deleverage Price</TextGrey>
                  <DeleveragePrice position={position} isPhone />
                </InfoRow> */}

                  {/* {!position?.calulateClosingFee?.(now)?.fee || (
                  <InfoRow>
                    <TextGrey>Anti-Bot Fee</TextGrey>
                    <ClosingFee
                      now={now}
                      position={position}
                      isPhone={isPhone}
                    />
                  </InfoRow>
                )} */}
                  {/* <InfoRow>
                  <Text>Reserve</Text>
                  <Reserve pool={position.pool}/>
                </InfoRow> */}
                  {/* <InfoRow>
                  <Text>Pool</Text>
                  <ExplorerLink poolAddress={position.poolAddress}/>
                </InfoRow> */}

                  <InfoRow>
                  <React.Fragment></React.Fragment>
                  <ButtonSell
                        size='small'
                        onClick={(e) => {
                          window.open(`https://app.uniswap.org/pool/${posKey.split('-')[1]}`, '_blank');
                        }}
                      >
                        Explore
                      </ButtonSell>
                </InfoRow>
                </div>
              )
            })}
          </div>
        )
      ) : (
        isFetchingPosition ? <PositionLoadingComponent/> :
        <table className='positions-table'>
          <thead>
            <tr>
              <th>Pool</th>
              <th>Reserves</th>
              <th>Size</th>
              <th className='no-wrap'>
                Price Range {' '}
                {positions?.length > 0 && (
                  <Text
                    className='text-link'
                    onClick={()=> {setRevertRange(!revertRange)}}

                  >
                   ⇄ 
                  </Text>
                )}
              </th>
              <th>Fee</th>
              {/* {showSize && <th>Size</th>}
              <th>Delev. Price</th>
              {!hasClosingFee || <th>Anti-Bot Fee</th>}
              {isShowAllPosition && <th style={{ textAlign: 'right' }}>
                <ButtonSell
                  size='small'
                  disabled={Object.keys(selections).length == 0}
                  onClick={(e) => {
                    setBatchTransferModalVisible(!isBatchTransferModalVisible)
                  }}
                >
                  Transfer
                </ButtonSell>
              </th>} */}
              {/* <th>Reserve</th> */}
              {/* <th>Pool</th> */}
              <th />
            </tr>
          </thead>
          <tbody>
            {Object.keys(displayUni3Positions).map((posKey, key: number) => {
              const position = displayUni3Positions[posKey]
              return (
                <tr
                  className='position-row'
                  onClick={() => {
                    setCurrentUni3Position(posKey)
                    // const pool = pools[position.poolAddress]
                    // if (pool?.ORACLE?.length) {
                    //   updateCurrentPoolGroup(poolToIndexID(pool))
                    // }
                    // if (tradeType === TRADE_TYPE.SWAP) {
                    //   setOutputTokenAddressToBuy(position.token)
                    // } else {
                    //   const { address } = decodeErc1155Address(position.token)
                    //   const side =
                    //     tradeType === TRADE_TYPE.LONG
                    //       ? POOL_IDS.A
                    //       : tradeType === TRADE_TYPE.SHORT
                    //         ? POOL_IDS.B
                    //         : POOL_IDS.C
                    //   setCurrentPoolAddress(address)
                    //   setOutputTokenAddressToBuy(
                    //     encodeErc1155Address(address, side)
                    //   )
                    // }
                  }}
                  key={key}
                >
                  <td>
                  <TextGrey className='d-flex align-item-center'>
                      <TokenIcon
                        tokenAddress={position?.token0}
                        size={16}
                        iconSize='1.4ex'
                      />{' '}
                      {position.token0Data.symbol}/{' '}
                      <TokenIcon
                        tokenAddress={position?.token1}
                        size={16}
                        iconSize='1.4ex'
                      />{' '}
                      {position.token1Data.symbol}
                    </TextGrey>
                  </td>
                  <td>
                  <TextGrey className='d-flex align-item-center'>
                      <TokenIcon
                        tokenAddress={position?.token0}
                        size={16}
                        iconSize='1.4ex'
                      />
                      {zerofy(position.posLiquidityToken0)}
                      {' '} + {' '}<TokenIcon
                        tokenAddress={position?.token1}
                        size={16}
                        iconSize='1.4ex'
                      />
                      {zerofy(position.posLiquidityToken1)}
                    </TextGrey>
                  </td>
                  <td>
                      {/* {Number?.(position?.entryPrice) > 0 ? (
                        <EntryPrice
                          position={position}
                          loading={position.status === POSITION_STATUS.ExploreING}
                        /> */}

                      <Text className='d-flex align-item-center'>
                        ${zerofy(position.totalPositionByUSD ?? 0)}{' '}
                      </Text>
                  </td>
                  <td>
                    <div className='net-value-and-pnl'>
                    <React.Fragment>
                      {revertRange ? 
                      <TextGrey className='d-flex align-item-center'>
                        {zerofy(1/position.pxUpper)}
                        {'<-->'}
                        {zerofy(1 / position.pxLower)} (<TokenIcon
                          tokenAddress={position?.token0}
                          size={16}
                          iconSize='1.4ex'
                        />{' '}
                        /  <TokenIcon
                          tokenAddress={position?.token1}
                          size={16}
                          iconSize='1.4ex'
                        />)
                      </TextGrey> :  <TextGrey className='d-flex align-item-center'>
                        {zerofy(position.pxUpper)}
                        {'<-->'}
                        {zerofy(position.pxLower)} (<TokenIcon
                          tokenAddress={position?.token1}
                          size={16}
                          iconSize='1.4ex'
                        />{' '}
                        /  <TokenIcon
                          tokenAddress={position?.token0}
                          size={16}
                          iconSize='1.4ex'
                        />)
                  
                      </TextGrey>}
                    </React.Fragment>
                      {/* <NetValue
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
                      )} */}
                    </div>
                  </td>
                  <td>
                       <Text>{Number(position.fee) / 1e4}%</Text>
                  </td>
                  {/* <td>
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
                  )} */}
                  {/* <td><Reserve pool={position.pool}/></td> */}
                  {/* <td><ExplorerLink poolAddress={position.poolAddress}/></td> */}
                  <td className='text-right'>
                  <ButtonSell
                        size='small'
                        onClick={(e) => {
                          window.open(`https://app.uniswap.org/pool/${posKey.split('-')[1]}`, '_blank');
                        }}
                      >
                        Explore
                      </ButtonSell>
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
