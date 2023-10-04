import { BigNumber } from 'ethers'
import LeverageSlider from 'leverage-slider/dist/component'
import _ from 'lodash'
import moment from 'moment'
import 'rc-slider/assets/index.css'
import React, { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import isEqual from 'react-fast-compare'
import { useGenerateLeverageData } from '../../hooks/useGenerateLeverageData'
import { useListTokenHasUniPool } from '../../hooks/useListTokenHasUniPool'
import { useConfigs } from '../../state/config/useConfigs'
import { useHelper } from '../../state/config/useHelper'
import { useCurrentPool } from '../../state/currentPool/hooks/useCurrentPool'
import { useCurrentPoolGroup } from '../../state/currentPool/hooks/useCurrentPoolGroup'
import { CHART_TABS } from '../../state/currentPool/type'
import { useResource } from '../../state/resources/hooks/useResource'
import { useSettings } from '../../state/setting/hooks/useSettings'
import { useListTokens } from '../../state/token/hook'
import { useWalletBalance } from '../../state/wallet/hooks/useBalances'
import { NATIVE_ADDRESS, POOL_IDS, TRADE_TYPE } from '../../utils/constant'
import formatLocalisedCompactNumber, {
  formatWeiToDisplayNumber
} from '../../utils/formatBalance'
import {
  IEW,
  NUM,
  bn,
  decodeErc1155Address,
  div,
  formatFloat,
  formatPercent,
  getTitleBuyTradeType,
  isErc1155Address,
  kx,
  whatDecimalSeparator,
  xr,
  zerofy
} from '../../utils/helpers'
import { ApproveUtrModal } from '../ApproveUtrModal'
import { ButtonSwap } from '../ButtonSwap'
import { SelectTokenModal } from '../SelectTokenModal'
import { TxFee } from '../SwapBox/components/TxFee'
import { useCalculateSwap } from '../SwapBox/hooks/useCalculateSwap'
import { useTokenValue } from '../SwapBox/hooks/useTokenValue'
import Tooltip from '../Tooltip/Tooltip'
import { Box } from '../ui/Box'
import { IconArrowDown } from '../ui/Icon'
import NumberInput from '../ui/Input/InputNumber'
import { SkeletonLoader } from '../ui/SkeletonLoader'
import { Text, TextError, TextGrey, TextWarning } from '../ui/Text'
import { TokenIcon } from '../ui/TokenIcon'
import { TokenSymbol } from '../ui/TokenSymbol'
import './style.scss'

const Q128 = BigNumber.from(1).shl(128)

const Component = ({
  tradeType = TRADE_TYPE.LONG,
  inputTokenAddress,
  outputTokenAddress,
  setInputTokenAddress,
  setOutputTokenAddress,
  tokenOutMaturity
}: {
  tradeType?: TRADE_TYPE
  inputTokenAddress: string
  outputTokenAddress: string
  setInputTokenAddress: any
  setOutputTokenAddress: any
  tokenOutMaturity: BigNumber
}) => {
  const [barData, setBarData] = useState<any>({})
  const { configs } = useConfigs()
  const { id, chartTab, setChartTab, setTradeType } =
    useCurrentPoolGroup()
  const [visibleSelectTokenModal, setVisibleSelectTokenModal] =
    useState<boolean>(false)
  const [amountIn, setAmountIn] = useState<string>('')
  const { balances } = useWalletBalance()
  const [visibleApproveModal, setVisibleApproveModal] = useState<boolean>(false)
  const { tokens } = useListTokens()
  const { wrapToNativeAddress } = useHelper()
  const { setCurrentPoolAddress, setDr } = useCurrentPool()
  const { settings } = useSettings()
  const { convertTokenValue } = useTokenValue({})
  const leverageData = useGenerateLeverageData(tradeType)
  const { pools } = useResource()

  useEffect(() => {
    if (
      tradeType === TRADE_TYPE.LIQUIDITY &&
      chartTab !== CHART_TABS.FUNC_PLOT
    ) {
      setChartTab(CHART_TABS.FUNC_PLOT)
    }
    if (
      tradeType !== TRADE_TYPE.LIQUIDITY &&
      chartTab === CHART_TABS.FUNC_PLOT
    ) {
      setChartTab(CHART_TABS.CANDLE_CHART)
    }

    setTradeType(tradeType)
  }, [tradeType])

  useEffect(() => {
    if (barData.token) {
      setOutputTokenAddress(barData.token)
      setCurrentPoolAddress(decodeErc1155Address(barData.token).address)
    }
  }, [barData])

  const { callError, loading, gasUsed, amountOut, payloadAmountIn } =
    useCalculateSwap({
      amountIn,
      setAmountIn,
      inputTokenAddress,
      outputTokenAddress,
      tokenOutMaturity
    })

  useEffect(() => {
    if (Object.values(pools).length > 0) {
      if (outputTokenAddress && !inputTokenAddress) {
        const { address } = decodeErc1155Address(outputTokenAddress)
        if (
          inputTokenAddress &&
          pools[address]?.TOKEN_R &&
          wrapToNativeAddress(inputTokenAddress) !==
          wrapToNativeAddress(pools[address]?.TOKEN_R)
        ) {
          setInputTokenAddress(wrapToNativeAddress(pools[address]?.TOKEN_R))
        }
      } else if (outputTokenAddress) {
        for (let i = 0; i < leverageData.length; i++) {
          const leve: any = leverageData[i]
          for (let k = 0; k < leve.bars.length; k++) {
            if (leve.bars[k].token.includes(outputTokenAddress.slice(0, -3))) {
              setBarData(leve.bars[k])
              break
            }
          }
        }
      }
      if (!inputTokenAddress) {
        setInputTokenAddress(
          wrapToNativeAddress(Object.values(pools)[0].TOKEN_R)
        )
      }
    }
  }, [outputTokenAddress, inputTokenAddress, pools, id])

  const { value: valueIn } = useTokenValue({
    amount: amountIn,
    tokenAddress: inputTokenAddress
  })

  const { value: valueOut } = useTokenValue({
    amount: amountOut,
    tokenAddress: outputTokenAddress
  })

  const { value: valueOutBefore } = useTokenValue({
    amount: IEW(
      balances[outputTokenAddress],
      tokens[outputTokenAddress]?.decimal || 18
    ),
    tokenAddress: outputTokenAddress
  })

  const payoffRate = useMemo(() => {
    if (valueOut && valueIn && Number(valueOut) && Number(valueIn)) {
      return NUM(div(valueOut, valueIn))
    }
    return undefined
  }, [valueIn, valueOut])

  const [poolToShow, sideToShow] = useMemo(() => {
    if (isErc1155Address(outputTokenAddress)) {
      const { address, id } = decodeErc1155Address(outputTokenAddress)
      return [pools[address], Number(id)]
    } else if (isErc1155Address(inputTokenAddress)) {
      const { address, id } = decodeErc1155Address(inputTokenAddress)
      return [pools[address], Number(id)]
    }
    return [null, null]
  }, [pools, inputTokenAddress, outputTokenAddress])

  useEffect(() => {
    if (!poolToShow?.TOKEN_R) return
    const amountInConvert = convertTokenValue(inputTokenAddress, poolToShow.TOKEN_R, amountIn)
    switch (tradeType) {
      case TRADE_TYPE.LONG:
        setDr(Number(amountInConvert), 0, 0)
        break
      case TRADE_TYPE.SHORT:
        setDr(0, Number(amountInConvert), 0)
        break
      case TRADE_TYPE.LIQUIDITY:
        setDr(0, 0, Number(amountInConvert))
        break
      default:
        setDr(0, 0, 0)
    }
  }, [amountIn, tradeType, inputTokenAddress, poolToShow?.TOKEN_R])

  const { erc20TokenSupported } = useListTokenHasUniPool(poolToShow)

  const tokensToSelect = useMemo(() => {
    if (!id || !poolToShow?.TOKEN_R) return []
    const tokenRs = [poolToShow.TOKEN_R]
    if (poolToShow.TOKEN_R === configs.wrappedTokenAddress) {
      tokenRs.push(NATIVE_ADDRESS)
    }

    return _.uniq(
      [...tokenRs, ...erc20TokenSupported].filter((address) => {
        if (tokenRs.includes(address)) return true
        return balances[address]?.gt(0)
      })
    )
  }, [erc20TokenSupported, balances, id])

  const onSelectToken = useCallback(
    (address: string) => {
      if (
        (address === outputTokenAddress)
      ) {
        return
      }
      setInputTokenAddress(address)
    },
    [inputTokenAddress, outputTokenAddress]
  )

  // TODO: kA, kB, xA, xB can be calculated in derivable-tools for each pool
  const [leverageKey, leverageValue] = useMemo(() => {
    if (!poolToShow) {
      return ['', null]
    }

    const {
      states: { a, b, R, spot },
      MARK,
      baseToken,
      quoteToken
    } = poolToShow
    const k = poolToShow.k.toNumber()
    const kA = kx(k, R, a, spot, MARK)
    const kB = -kx(-k, R, b, spot, MARK)
    const ek =
      sideToShow === POOL_IDS.A ? kA : sideToShow === POOL_IDS.B ? kB : k

    if (ek < k) {
      const power = formatFloat(ek / 2, 2)
      return [
        'Effective Leverage',
        ek < k / 2 ? (
          <TextError>{power}</TextError>
        ) : (
          <TextWarning>{power}</TextWarning>
        )
      ]
    }

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

    if (sideToShow === POOL_IDS.A) {
      return ['Deleverage Price', <Text key={0}>{zerofy(dgA)}</Text>]
    }
    if (sideToShow === POOL_IDS.B) {
      return ['Deleverage Price', <Text key={0}>{zerofy(dgB)}</Text>]
    }
    return [
      'Full Leverage Range',
      <Text key={0}>
        {zerofy(dgB)}-{zerofy(dgA)}
      </Text>
    ]
  }, [poolToShow, sideToShow, tokens])

  const power = useMemo(() => {
    if (!poolToShow) {
      return 1
    }
    return poolToShow.k.toNumber() / 2
  }, [poolToShow])

  const showSize =
    tradeType === TRADE_TYPE.LONG || tradeType === TRADE_TYPE.SHORT

  const { value: liquidity } = useTokenValue({
    amount: IEW(poolToShow?.states?.R, tokens[poolToShow?.TOKEN_R]?.decimals),
    tokenAddress: poolToShow?.TOKEN_R
  })

  const [interest, premium, fundingRate, interestRate, maxPremiumRate] = useMemo(() => {
    const tokenAddress =
      isErc1155Address(outputTokenAddress) ? outputTokenAddress
        : isErc1155Address(inputTokenAddress) ? inputTokenAddress : undefined
    if (!tokenAddress) {
      return [0, 0, 0, 0, 0]
    }
    const { address, id } = decodeErc1155Address(tokenAddress)
    const pool = pools[address] ?? poolToShow
    if (!pool) {
      return [0, 0, 0, 0, 0]
    }
    const { sides, interestRate, maxPremiumRate } = pool
    const interest = sides[id].interest ?? 0
    const premium = NUM(sides[id].premium)
    const fundingRate = interest + premium
    return [interest, premium, fundingRate, interestRate, maxPremiumRate]
  }, [inputTokenAddress, outputTokenAddress, pools, poolToShow])

  useEffect(() => {
    if (!tokensToSelect.includes(inputTokenAddress)) {
      setInputTokenAddress(NATIVE_ADDRESS)
    }
  }, [tokensToSelect, inputTokenAddress])

  return (
    <div className='long-short-box'>
      <div className='amount-input-box'>
        <div className='amount-input-box__head'>
          <span
            className='current-token'
            onClick={(address) => {
              setVisibleSelectTokenModal(true)
            }}
          >
            <TokenIcon size={24} tokenAddress={inputTokenAddress} />
            <Text>
              <TokenSymbol token={inputTokenAddress} />
            </Text>
          </span>
          <div className='d-flex align-item-center'>
            <Text
              className='amount-input-box__head--balance'
              onClick={() => {
                setAmountIn(
                  IEW(
                    balances[inputTokenAddress],
                    tokens[inputTokenAddress]?.decimal || 18
                  )
                )
              }}
            >
              Balance:{' '}
              {!balances || !balances[inputTokenAddress]
                ? 0
                : formatLocalisedCompactNumber(
                  formatFloat(
                    IEW(
                      balances[inputTokenAddress],
                        tokens[inputTokenAddress]?.decimal ?? 18
                    )
                  )
                )}
            </Text>
          </div>
        </div>
        <NumberInput
          placeholder='0.0'
          value={amountIn}
          onValueChange={(e) => {
            if (Number(e.target.value) >= 0) {
              setAmountIn((e.target as HTMLInputElement).value)
            }
          }}
          suffix={
            Number(valueIn) > 0 ? (
              <TextGrey>
                ${formatLocalisedCompactNumber(formatFloat(valueIn))}
              </TextGrey>
            ) : (
              ''
            )
          }
        />
      </div>

      <SelectTokenModal
        visible={visibleSelectTokenModal}
        setVisible={setVisibleSelectTokenModal}
        displayFee
        tokens={tokensToSelect}
        onSelectToken={onSelectToken}
      />

      {outputTokenAddress && (
        <div className='pl-5 mt-1 mb-2'>
          <IconArrowDown fill='#01A7FA' />
        </div>
      )}

      {outputTokenAddress && (
        <Box
          borderColor={
            tradeType === TRADE_TYPE.LONG
              ? 'buy'
              : tradeType === TRADE_TYPE.SHORT
                ? 'sell'
                : 'blue'
          }
          className='estimate-box swap-info-box mt-1 mb-1'
        >
          <span
            className={`estimate-box__leverage ${getTitleBuyTradeType(
              tradeType
            ).toLowerCase()}`}
          >
            <TokenSymbol token={outputTokenAddress} />
          </span>
          <div className='position-delta--box'>
            <div className='position-delta--left'>
              {settings.showBalance && <div>Balance</div>}
              <div>Value</div>
              {showSize && <div>Size</div>}
            </div>
            <SkeletonLoader loading={balances[outputTokenAddress] == null}>
              {balances[outputTokenAddress]?.gt(0) && (
                <div className='position-delta--group'>
                  <div className='position-delta--right'>
                    {settings.showBalance && (
                      <div>
                        {
                          formatWeiToDisplayNumber(
                            balances[outputTokenAddress] ?? bn(0),
                            4,
                            tokens[outputTokenAddress]?.decimal || 18
                          ).split('.')[0]
                        }
                      </div>
                    )}
                    <div>
                      ${zerofy(formatFloat(valueOutBefore)).split('.')[0]}
                    </div>
                    {showSize && (
                      <div>
                        $
                        {
                          zerofy(
                            formatFloat(Number(valueOutBefore) * power)
                          ).split('.')[0]
                        }
                      </div>
                    )}
                  </div>
                  <div className='position-delta--left'>
                    {settings.showBalance && (
                      <div>
                        {formatWeiToDisplayNumber(
                          balances[outputTokenAddress] ?? bn(0),
                          4,
                          tokens[outputTokenAddress]?.decimal || 18
                        ).match(/\.\d+$/g) || '\u00A0'}
                      </div>
                    )}
                    <div>
                      {zerofy(formatFloat(valueOutBefore)).match(/\.\d+$/g) ||
                        '\u00A0'}
                    </div>
                    {showSize && (
                      <div>
                        {zerofy(
                          formatFloat(Number(valueOutBefore) * power)
                        ).match(/\.\d+$/g) || '\u00A0'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </SkeletonLoader>
            {!Number(amountIn) || !balances[outputTokenAddress]?.gt(0) ? (
              ''
            ) : (
              <div className='position-delta--left'>
                {settings.showBalance && <div>+</div>}
                {showSize && <div>+</div>}
                <div>+</div>
              </div>
            )}
            {!Number(amountIn) ? (
              ''
            ) : (
              <SkeletonLoader loading={!Number(valueOut)}>
                <div className='position-delta--group'>
                  <div className='position-delta--right'>
                    {settings.showBalance && (
                      <div>
                        {
                          formatLocalisedCompactNumber(
                            formatFloat(amountOut)
                          ).split(whatDecimalSeparator())[0]
                        }
                      </div>
                    )}
                    <div>
                      $
                      {
                        formatLocalisedCompactNumber(
                          formatFloat(valueOut)
                        ).split(whatDecimalSeparator())[0]
                      }
                    </div>
                    {showSize && (
                      <div>
                        $
                        {
                          formatLocalisedCompactNumber(
                            formatFloat(Number(valueOut) * power)
                          ).split('.')[0]
                        }
                      </div>
                    )}
                  </div>
                  <div className='position-delta--left'>
                    {settings.showBalance && (
                      <div>
                        {formatLocalisedCompactNumber(
                          formatFloat(amountOut)
                        ).match(/\.\d+$/g) || '\u00A0'}
                      </div>
                    )}
                    <div>
                      {formatLocalisedCompactNumber(
                        formatFloat(valueOut)
                      ).match(/\.\d+$/g) || '\u00A0'}
                    </div>
                    {showSize && (
                      <div>
                        {formatLocalisedCompactNumber(
                          formatFloat(Number(valueOut) * power)
                        ).match(/\.\d+$/g) || '\u00A0'}
                      </div>
                    )}
                  </div>
                </div>
              </SkeletonLoader>
            )}
          </div>
        </Box>
      )}
      {leverageData.length > 0 && (
        <div className={leverageData.length === 1 ? 'hidden' : ''}>
          <LeverageSlider
            barData={barData}
            setBarData={(e: any) => {
              setBarData(e)
            }}
            leverageData={leverageData}
            height={100}
            key={id}
          />
        </div>
      )}

      <Box borderColor='default' className='swap-info-box mt-1 mb-1 no-wrap'>
        <InfoRow>
          <TextGrey>Liquidity</TextGrey>
          <SkeletonLoader loading={!liquidity || liquidity === '0'}>
            <Text>
              ${formatLocalisedCompactNumber(formatFloat(liquidity, 2))}
            </Text>
          </SkeletonLoader>
        </InfoRow>
        {/* <InfoRow> */}
        {/*  <TextGrey>Daily Interest Rate</TextGrey> */}
        {/*  <SkeletonLoader loading={!poolToShow}> */}
        {/*    {formatPercent((poolToShow?.interestRate ?? 0) / power / 2, 3, true)}% */}
        {/*  </SkeletonLoader> */}
        {/* </InfoRow> */}

        <InfoRow>
          <TextGrey>{leverageKey ?? 'Leverage'}</TextGrey>
          <SkeletonLoader loading={!poolToShow || !leverageValue}>
            {leverageValue}
          </SkeletonLoader>
        </InfoRow>

        {tradeType === TRADE_TYPE.LIQUIDITY ? (
          <InfoRow>
            <TextGrey>Funding Yield</TextGrey>
            <SkeletonLoader loading={!poolToShow}>
              <Tooltip
                position='right-bottom'
                handle={
                  <Text className={fundingRate < 0 ? 'text-green' : 'text-warning'}>
                    {zerofy(formatFloat(fundingRate * 100, undefined, 3, true))}%
                  </Text>
                }
                renderContent={() => (
                  <div>
                    <div>
                      <TextGrey>Interest:&nbsp;</TextGrey>
                      <Text>{zerofy(formatFloat(interest * 100, undefined, 3, true))}%</Text>
                    </div>
                    <div>
                      <TextGrey>Premium:&nbsp;</TextGrey>
                      <Text className={premium < 0 ? 'text-green' : 'text-warning'}>
                        {zerofy(formatFloat(premium * 100, undefined, 3, true))}%
                      </Text>
                    </div>
                    <div>
                      <TextGrey>Max Premium:&nbsp;</TextGrey>
                      <Text>{zerofy(formatFloat(maxPremiumRate * 100, undefined, 3, true))}%</Text>
                    </div>
                  </div>
                )}
              />
            </SkeletonLoader>
          </InfoRow>
        ) : (
          <InfoRow>
            <TextGrey>Funding Rate</TextGrey>
            <SkeletonLoader loading={!poolToShow}>
              <Tooltip
                position='right-bottom'
                handle={
                  <Text className={fundingRate < 0 ? 'text-green' : 'text-warning'}>
                    {zerofy(formatFloat(fundingRate * 100, undefined, 3, true))}%
                  </Text>
                }
                renderContent={() => (
                  <div>
                    <div>
                      <TextGrey>Interest:&nbsp;</TextGrey>
                      <Text>{zerofy(formatFloat(interest * 100, undefined, 3, true))}%</Text>
                    </div>
                    <div>
                      <TextGrey>Premium:&nbsp;</TextGrey>
                      <Text className={premium < 0 ? 'text-green' : 'text-warning'}>
                        {zerofy(formatFloat(premium * 100, undefined, 3, true))}%
                      </Text>
                    </div>
                    <div>
                      <TextGrey>Max Premium:&nbsp;</TextGrey>
                      <Text>{zerofy(formatFloat(maxPremiumRate * 100, undefined, 3, true))}%</Text>
                    </div>
                  </div>
                )}
              />
              {/* <Text className={fundingRate < 0 ? 'text-green' : 'text-warning'}>
                {zerofy(formatFloat(fundingRate * 100, undefined, 3, true))}%
              </Text> */}
            </SkeletonLoader>
          </InfoRow>
        )}

        <hr />

        {tradeType === TRADE_TYPE.LIQUIDITY ? (
          <InfoRow>
            <TextGrey>Interest Rate</TextGrey>
            <SkeletonLoader loading={!poolToShow}>
              {formatFloat(interestRate * 100, undefined, 3, true)}%
            </SkeletonLoader>
          </InfoRow>
        ) : <Fragment />}

        {!poolToShow?.MATURITY_VEST?.toNumber() || (
          <InfoRow>
            <TextGrey>Position Vesting</TextGrey>
            <SkeletonLoader loading={!poolToShow}>
              {moment
                .duration(poolToShow?.MATURITY_VEST.toNumber(), 'seconds')
                .humanize()}
            </SkeletonLoader>
          </InfoRow>
        )}
        {!poolToShow?.MATURITY?.toNumber() ||
          !poolToShow?.MATURITY_RATE?.gt(0) || (
          <InfoRow>
            <TextGrey>Closing Fee</TextGrey>
            <SkeletonLoader loading={!poolToShow}>
              {formatPercent(
                Q128.sub(poolToShow?.MATURITY_RATE)
                  .mul(10000)
                  .div(Q128)
                  .toNumber() / 10000,
                2,
                true
              )}
                % for{' '}
              {moment
                .duration(poolToShow?.MATURITY.toNumber(), 'seconds')
                .humanize()}
            </SkeletonLoader>
          </InfoRow>
        )}
      </Box>

      <TxFee
        gasUsed={gasUsed}
        payoffRate={payoffRate}
        loading={loading && Number(amountIn) > 0}
      />

      {/* <Box borderColor='default' className='swap-info-box mt-1 mb-1'> */}
      {/*  <InfoRow> */}
      {/*    <TextGrey>Gas Used</TextGrey> */}
      {/*    <span> */}
      {/*      <Text>{formatWeiToDisplayNumber(gasUsed, 0, 0)}</Text> */}
      {/*    </span> */}
      {/*  </InfoRow> */}
      {/*  <InfoRow> */}
      {/*    <TextGrey>Transaction Fee</TextGrey> */}
      {/*    <span> */}
      {/*      <Text> */}
      {/*        {weiToNumber(txFee, 18, 4)} */}
      {/*        <TextGrey> {chainId === 56 ? 'BNB' : 'ETH'} </TextGrey> */}
      {/*        (${weiToNumber(txFee.mul(numberToWei(nativePrice)), 36, 2)}) */}
      {/*      </Text> */}
      {/*    </span> */}
      {/*  </InfoRow> */}
      {/* </Box> */}

      <div className='actions'>
        <ButtonSwap
          payoffRate={payoffRate}
          inputTokenAddress={inputTokenAddress}
          outputTokenAddress={outputTokenAddress}
          amountIn={amountIn}
          payloadAmountIn={payloadAmountIn}
          amountOut={amountOut}
          callError={callError}
          gasUsed={gasUsed}
          tradeType={tradeType}
          loadingAmountOut={loading}
          tokenOutMaturity={tokenOutMaturity}
          confirmModal
          title={
            Number(decodeErc1155Address(outputTokenAddress).id) ===
            POOL_IDS.A ? (
                <Text>
                  <TokenSymbol token={outputTokenAddress} textWrap={Text} />{' '}
                </Text>
              ) : Number(decodeErc1155Address(outputTokenAddress).id) ===
              POOL_IDS.B ? (
                  <Text>
                    <TokenSymbol token={outputTokenAddress} textWrap={Text} />{' '}
                  </Text>
                ) : (
                  <Text>
                Add <TokenSymbol token={outputTokenAddress} textWrap={Text} />{' '}
                  </Text>
                )
          }
        />
      </div>
      <ApproveUtrModal
        callBack={() => {
        }}
        visible={visibleApproveModal}
        setVisible={setVisibleApproveModal}
        inputTokenAddress={inputTokenAddress}
      />
    </div>
  )
}

const InfoRow = (props: any) => {
  return (
    <div
      className={
        'd-flex jc-space-between info-row font-size-14 ' + props.className
      }
    >
      {props.children}
    </div>
  )
}

export const BuyPositionBox = React.memo(Component, (prevProps, nextProps) =>
  isEqual(prevProps, nextProps)
)
