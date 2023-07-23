import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Text, TextGrey } from '../ui/Text'
import './style.scss'
import { Box } from '../ui/Box'
import 'rc-slider/assets/index.css'
import { IconArrowDown, SettingIcon } from '../ui/Icon'
import { Input } from '../ui/Input'
import { TokenIcon } from '../ui/TokenIcon'
import { useCurrentPoolGroup } from '../../state/currentPool/hooks/useCurrentPoolGroup'
import { SelectTokenModal } from '../SelectTokenModal'
import { useWalletBalance } from '../../state/wallet/hooks/useBalances'
import { useListTokens } from '../../state/token/hook'
import {
  bn,
  decodeErc1155Address, div,
  formatFloat, formatPercent,
  getTitleBuyTradeType,
  isErc1155Address,
  weiToNumber
} from '../../utils/helpers'
import { TokenSymbol } from '../ui/TokenSymbol'
import { NATIVE_ADDRESS, POOL_IDS, TRADE_TYPE } from '../../utils/constant'
import { useConfigs } from '../../state/config/useConfigs'
import formatLocalisedCompactNumber, { formatWeiToDisplayNumber } from '../../utils/formatBalance'
import isEqual from 'react-fast-compare'
import { ApproveUtrModal } from '../ApproveUtrModal'
import _ from 'lodash'
import { useGenerateLeverageData } from '../../hooks/useGenerateLeverageData'
import { useTokenValue } from '../SwapBox/hooks/useTokenValue'
import { useHelper } from '../../state/config/useHelper'
import { useCalculateSwap } from '../SwapBox/hooks/useCalculateSwap'
import { ButtonSwap } from '../ButtonSwap'
import { TxFee } from '../SwapBox/components/TxFee'
import LeverageSlider from 'leverage-slider/dist/component'
import { CHART_TABS } from '../../state/currentPool/type'
import { useCurrentPool } from '../../state/currentPool/hooks/useCurrentPool'
import { SkeletonLoader } from '../ui/SkeletonLoader'

const Component = ({
  tradeType = TRADE_TYPE.LONG,
  inputTokenAddress,
  outputTokenAddress,
  setInputTokenAddress,
  setOutputTokenAddress
}: {
  tradeType?: TRADE_TYPE,
  inputTokenAddress: string
  outputTokenAddress: string
  setInputTokenAddress: any
  setOutputTokenAddress: any
}) => {
  const [barData, setBarData] = useState<any>({})
  const { configs } = useConfigs()
  const { allTokens, id, pools, chartTab, setChartTab, setTradeType } = useCurrentPoolGroup()
  const [visibleSelectTokenModal, setVisibleSelectTokenModal] = useState<boolean>(false)
  const [tokenTypeToSelect, setTokenTypeToSelect] = useState<'input' | 'output'>('input')
  const [amountIn, setAmountIn] = useState<string>('')
  const { balances } = useWalletBalance()
  const [visibleApproveModal, setVisibleApproveModal] = useState<boolean>(false)
  const { tokens } = useListTokens()
  const { wrapToNativeAddress } = useHelper()
  const { setCurrentPoolAddress, setDr } = useCurrentPool()

  const leverageData = useGenerateLeverageData(tradeType)

  // TODO: load this
  const expiration = 0
  const expirationDelta = 0

  useEffect(() => {
    if (tradeType === TRADE_TYPE.LIQUIDITY && chartTab !== CHART_TABS.FUNC_PLOT) {
      setChartTab(CHART_TABS.FUNC_PLOT)
    }
    if (tradeType !== TRADE_TYPE.LIQUIDITY && chartTab === CHART_TABS.FUNC_PLOT) {
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

  useEffect(() => {
    switch (tradeType) {
      case TRADE_TYPE.LONG:
        setDr(Number(amountIn), 0, 0)
        break
      case TRADE_TYPE.SHORT:
        setDr(0, Number(amountIn), 0)
        break
      case TRADE_TYPE.LIQUIDITY:
        setDr(0, 0, Number(amountIn))
        break
      default:
        setDr(0, 0, 0)
    }
  }, [amountIn, tradeType])

  const { callError, loading, gasUsed, amountOut } = useCalculateSwap({
    amountIn,
    inputTokenAddress,
    outputTokenAddress
  })

  useEffect(() => {
    if (Object.values(pools).length > 0) {
      if (outputTokenAddress) {
        for (let i = 0; i < leverageData.length; i++) {
          const leve: any = leverageData[i]
          for (let k = 0; k < leve.bars.length; k++) {
            if (leve.bars[k].token.includes(outputTokenAddress.slice(0, -3))) {
              setBarData(leve.bars[k])
              break
            }
          }
        }
        const { address } = decodeErc1155Address(outputTokenAddress)
        if (inputTokenAddress && pools[address]?.TOKEN_R && wrapToNativeAddress(inputTokenAddress) !== wrapToNativeAddress(pools[address]?.TOKEN_R)) {
          // console.log(inputTokenAddress, pools, address, pools[address]?.TOKEN_R)
          setInputTokenAddress(wrapToNativeAddress(pools[address]?.TOKEN_R))
        }
      } else if (Object.values(pools).length > 0) {
        setInputTokenAddress(wrapToNativeAddress(Object.values(pools)[0].TOKEN_R))
      }
    }
  }, [outputTokenAddress, pools, id])

  const { value: valueIn } = useTokenValue({
    amount: amountIn,
    tokenAddress: inputTokenAddress
  })

  const { value: valueOut } = useTokenValue({
    amount: amountOut,
    tokenAddress: outputTokenAddress
  })

  const { value: valueOutBefore } = useTokenValue({
    amount: weiToNumber(balances[outputTokenAddress], tokens[outputTokenAddress]?.decimal || 18),
    tokenAddress: outputTokenAddress
  })

  const payoffRate = useMemo(() => {
    if (valueOut && valueIn && Number(valueOut) && Number(valueIn)) {
      const rate = div(valueOut, valueIn)
      if (Number(rate) < 0.94) {
        // show FunctionPlot on low payoffRate
        setChartTab(CHART_TABS.FUNC_PLOT)
      }
      return formatPercent(rate, 2, true)
    }
    return undefined
  }, [valueIn, valueOut])

  const tokensToSelect = useMemo(() => {
    if (!id) return []
    const tokenRs = Object.values(pools).map((p: any) => p.TOKEN_R)
    if (tokenRs.includes(configs.addresses.wrapToken)) tokenRs.push(configs.addresses.nativeToken)
    return _.uniq(
      [
        ...tokenRs
      ].filter((address) => {
        if (tokenRs.includes(address)) return true
        if (tokenTypeToSelect === 'input' && (!balances[address] || balances[address].isZero())) {
          return false
        }
        return true
      })
    )
  }, [tokenTypeToSelect, allTokens, pools, id])

  const onSelectToken = useCallback((address: string) => {
    if ((tokenTypeToSelect === 'input' && address === outputTokenAddress) ||
      (tokenTypeToSelect === 'output' && address === inputTokenAddress)
    ) {
      // revertPairAddress()
      return
    }
    if (tokenTypeToSelect === 'input') {
      setInputTokenAddress(address)
    } else {
      if (isErc1155Address(address) && isErc1155Address(inputTokenAddress)) {
        const poolOutAddress = decodeErc1155Address(address).address
        const poolOut = pools[poolOutAddress]
        const poolInAddress = decodeErc1155Address(inputTokenAddress).address
        const poolIn = pools[poolInAddress]
        if (poolInAddress !== poolOutAddress && poolOut.TOKEN_R !== poolIn.TOKEN_R) {
          setInputTokenAddress(poolOut.TOKEN_R === configs.addresses.wrapToken ? NATIVE_ADDRESS : poolOut.TOKEN_R)
        }
      }
      if (isErc1155Address(address) && !isErc1155Address(inputTokenAddress)) {
        const poolOut = pools[decodeErc1155Address(address).address]
        setInputTokenAddress(poolOut.TOKEN_R === configs.addresses.wrapToken ? NATIVE_ADDRESS : poolOut.TOKEN_R)
      }
      // setOutputTokenAddress(address)
    }
  }, [pools, inputTokenAddress, outputTokenAddress, tokenTypeToSelect, configs])

  const poolToShow = useMemo(() => {
    if (isErc1155Address(outputTokenAddress)) {
      return pools[decodeErc1155Address(outputTokenAddress).address]
    } else if (isErc1155Address(inputTokenAddress)) {
      return pools[decodeErc1155Address(inputTokenAddress).address]
    }
    return null
  }, [pools, inputTokenAddress, outputTokenAddress])

  const deleverageRiskDisplay = useMemo(() => {
    if (!poolToShow) {
      return ''
    }
    const deleverageRisk: number | null =
      tradeType === TRADE_TYPE.LONG ? poolToShow.deleverageRiskA
        : tradeType === TRADE_TYPE.SHORT ? poolToShow.deleverageRiskB
          : Math.max(poolToShow.deleverageRiskA, poolToShow.deleverageRiskB)
    const deleverageRiskDisplay: string =
      deleverageRisk == null ? ''
        : formatPercent(Math.min(100, deleverageRisk), 0, true) + '%'
    return deleverageRiskDisplay
  }, [poolToShow, tradeType])

  const { value: liquidity } = useTokenValue({
    amount: weiToNumber(poolToShow?.states?.R, tokens[poolToShow?.TOKEN_R]?.decimals),
    tokenAddress: poolToShow?.TOKEN_R
  })

  return (
    <div className='long-short-box'>
      <div className='amount-input-box'>
        <div className='amount-input-box__head'>
          <span
            className='current-token'
            onClick={(address) => {
              setVisibleSelectTokenModal(true)
              setTokenTypeToSelect('input')
            }}
          >
            <TokenIcon size={24} tokenAddress={inputTokenAddress} />
            <Text><TokenSymbol token={inputTokenAddress} /></Text>
          </span>
          <div className='d-flex align-item-center'>
            <Text
              className='amount-input-box__head--balance'
              onClick={() => {
                setAmountIn(weiToNumber(balances[inputTokenAddress], tokens[inputTokenAddress]?.decimal || 18))
              }}
            >Balance: {balances && balances[inputTokenAddress]
                ? formatWeiToDisplayNumber(
                  balances[inputTokenAddress],
                  4,
                tokens[inputTokenAddress]?.decimal || 18
                )
                : 0
              }
            </Text>
          </div>
        </div>
        <Input
          placeholder='0.0'
          suffix={Number(valueIn) > 0 ? <TextGrey>${formatLocalisedCompactNumber(formatFloat(valueIn))}</TextGrey> : ''}
          className='fs-24'
          // @ts-ignore
          value={amountIn}
          onChange={(e) => {
            // @ts-ignore
            if (Number(e.target.value) >= 0) {
              setAmountIn((e.target as HTMLInputElement).value)
            }
          }}
        />
      </div>

      <SelectTokenModal
        visible={visibleSelectTokenModal}
        setVisible={setVisibleSelectTokenModal}
        displayFee={tokenTypeToSelect === 'input'}
        tokens={tokensToSelect}
        onSelectToken={onSelectToken}
      />

      {
        outputTokenAddress &&
        <div className='pl-5 mt-1 mb-2'>
          <IconArrowDown fill='#01A7FA' />
        </div>
      }

      {
        outputTokenAddress && <Box
          borderColor={tradeType === TRADE_TYPE.LONG ? 'buy' : tradeType === TRADE_TYPE.SHORT ? 'sell' : 'blue'}
          className='estimate-box swap-info-box mt-1 mb-1'
        >
          <span className={`estimate-box__leverage ${getTitleBuyTradeType(tradeType).toLowerCase()}`}>
            <TokenSymbol token={outputTokenAddress} />
          </span>
          <div className='position-delta--box'>
            <div className='position-delta--left'>
              <div>Balance</div>
              <div>Net Value</div>
              <div>Expiration</div>
            </div>
            <SkeletonLoader loading={balances[outputTokenAddress] == null}>
              {!Number(valueOutBefore) ? ''
                : <div className='position-delta--group'>
                  <div className='position-delta--right'>
                    <div>{
                      formatWeiToDisplayNumber(
                        balances[outputTokenAddress] ?? bn(0),
                        4,
                        tokens[outputTokenAddress]?.decimal || 18
                      ).split('.')[0]
                    }</div>
                    <div>${formatLocalisedCompactNumber(formatFloat(valueOutBefore)).split('.')[0]}</div>
                    <div>{expiration || '\u00A0'}</div>
                  </div>
                  <div className='position-delta--left'>
                    <div>{
                      formatWeiToDisplayNumber(
                        balances[outputTokenAddress] ?? bn(0),
                        4,
                        tokens[outputTokenAddress]?.decimal || 18
                      ).match(/\.\d+$/g) || '\u00A0'
                    }</div>
                    <div>{formatLocalisedCompactNumber(formatFloat(valueOutBefore)).match(/\.\d+$/g) || '\u00A0'}</div>
                    <div>{expiration ? '(s)' : '\u00A0'}</div>
                  </div>
                </div>
              }
            </SkeletonLoader>
            {!Number(amountIn) ? ''
              : <div className='position-delta--left'>
                <div>+</div>
                <div>+</div>
                <div>+</div>
              </div>
            }
            {!Number(amountIn) ? ''
              : <SkeletonLoader loading={!Number(valueOut)}>
                <div className='position-delta--group'>
                  <div className='position-delta--right'>
                    <div>{formatLocalisedCompactNumber(formatFloat(amountOut)).split('.')[0]}</div>
                    <div>${formatLocalisedCompactNumber(formatFloat(valueOut)).split('.')[0]}</div>
                    <div>{expirationDelta || '\u00A0'}</div>
                  </div>
                  <div className='position-delta--left'>
                    <div>{formatLocalisedCompactNumber(formatFloat(amountOut)).match(/\.\d+$/g) || '\u00A0'}</div>
                    <div>{formatLocalisedCompactNumber(formatFloat(valueOut)).match(/\.\d+$/g) || '\u00A0'}</div>
                    <div>{expirationDelta ? '(s)' : '\u00A0'}</div>
                  </div>
                </div>
              </SkeletonLoader>
            }
          </div>
        </Box>
      }
      {
        leverageData.length > 0 &&
        <LeverageSlider
          barData={barData}
          setBarData={setBarData}
          leverageData={leverageData}
          height={100}
          key={id}
        />
      }

      <Box borderColor='default' className='swap-info-box mt-1 mb-1'>
        <InfoRow>
          <TextGrey>Daily Interest Rate</TextGrey>
          <SkeletonLoader loading={!poolToShow}>
            {formatPercent((poolToShow?.dailyInterestRate ?? 0) / (poolToShow?.k.toNumber() ?? 1), 3, true)}%
          </SkeletonLoader>
        </InfoRow>
        {
          deleverageRiskDisplay !== '100%'
            ? <InfoRow>
              <TextGrey>Deleverage Risk</TextGrey>
              <Text>{deleverageRiskDisplay}</Text>
            </InfoRow>
            : <InfoRow>
              <TextGrey>Leverage:</TextGrey>
              <SkeletonLoader loading={!poolToShow}>
                <Text>{poolToShow?.k.toNumber() / 2}x</Text>
              </SkeletonLoader>
            </InfoRow>
        }
        <InfoRow>
          <TextGrey>Liquidity</TextGrey>
          <SkeletonLoader loading={!liquidity || liquidity == '0'}>
            <Text>${formatLocalisedCompactNumber(formatFloat(liquidity, 2))}</Text>
          </SkeletonLoader>
        </InfoRow>
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
          amountOut={amountOut}
          callError={callError}
          gasUsed={gasUsed}
          tradeType={tradeType}
          loadingAmountOut={loading}
          title={
            Number(decodeErc1155Address(outputTokenAddress).id) === POOL_IDS.A ? <Text>Long <TokenSymbol token={outputTokenAddress} textWrap={Text} /> </Text>
              : Number(decodeErc1155Address(outputTokenAddress).id) === POOL_IDS.B ? <Text>Short <TokenSymbol token={outputTokenAddress} textWrap={Text} /> </Text>
                : <Text>Add Liquidity <TokenSymbol token={outputTokenAddress} textWrap={Text} /> </Text>
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
