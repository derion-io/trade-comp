import { BigNumber } from 'ethers'
import LeverageSlider from 'leverage-slider/dist/component'
import _ from 'lodash'
import 'rc-slider/assets/index.css'
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import isEqual from 'react-fast-compare'
import { useGenerateLeverageData } from '../../hooks/useGenerateLeverageData'
import { useConfigs } from '../../state/config/useConfigs'
import { useHelper } from '../../state/config/useHelper'
import { useCurrentPool } from '../../state/currentPool/hooks/useCurrentPool'
import { useCurrentPoolGroup } from '../../state/currentPool/hooks/useCurrentPoolGroup'
import { CHART_TABS } from '../../state/currentPool/type'
import { useResource } from '../../state/resources/hooks/useResource'
import { useListTokens } from '../../state/token/hook'
import { useWalletBalance } from '../../state/wallet/hooks/useBalances'
import { NATIVE_ADDRESS, POOL_IDS, TRADE_TYPE } from '../../utils/constant'
import formatLocalisedCompactNumber from '../../utils/formatBalance'
import {
  DIV,
  IEW,
  NUM,
  WEI,
  baseRateFromHL,
  bn,
  calcPoolSide,
  decodeErc1155Address,
  div,
  formatFloat,
  getPoolPower,
  isErc1155Address,
  zerofy,
} from '../../utils/helpers'
import { ApproveUtrModal } from '../ApproveUtrModal'
import { ButtonSwap } from '../ButtonSwap'
import { SelectTokenModal } from '../SelectTokenModal'
import { TxFee } from '../SwapBox/components/TxFee'
import { useCalculateSwap } from '../SwapBox/hooks/useCalculateSwap'
import { useTokenValue } from '../SwapBox/hooks/useTokenValue'
import { IconArrowDown, SvgSpinners12DotsScaleRotate } from '../ui/Icon'
import NumberInput from '../ui/Input/InputNumber'
import { Text, TextGrey, TextLink, TextSell, TextWarning } from '../ui/Text'
import { TokenIcon } from '../ui/TokenIcon'
import { TokenSymbol } from '../ui/TokenSymbol'
import { EstimateBox } from './components/EstimateBox'
import { SwapInfoBox } from './components/SwapInfoBox'
import { DeleveragePrice } from '../Positions'
import './style.scss'
import { Spin } from 'antd'
import { useCalculatePara } from '../SwapBox/hooks/useCalculatePara'
import { parseEther } from 'ethers/lib/utils'
import { useSettings } from '../../state/setting/hooks/useSettings'
import { DownOutlined, SettingOutlined } from '@ant-design/icons'
import { usePoolRate } from '../../hooks/usePoolRate'

const Component = ({
  searchIndexCache,
  showAllPool,
  isLoadingIndex,
  setShowAllPool,
  tradeType = TRADE_TYPE.LONG,
  inputTokenAddress,
  outputTokenAddress,
  setInputTokenAddress,
  setOutputTokenAddress,
  tokenOutMaturity,
  setVisibleSettingModal,
}: {
  searchIndexCache?:{[key:string] : any},
  showAllPool?:boolean,
  isLoadingIndex?:boolean,
  setShowAllPool?: (s: boolean) => void,
  tradeType?: TRADE_TYPE
  inputTokenAddress: string
  outputTokenAddress: string
  setInputTokenAddress: any
  setOutputTokenAddress: any
  tokenOutMaturity: BigNumber
  setVisibleSettingModal?: React.Dispatch<React.SetStateAction<boolean>>
}) => {
  const [barData, setBarData] = useState<any>({})
  const { configs, routes } = useConfigs()
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
  const { convertTokenValue } = useTokenValue({})
  const { leverageData, totalHiddenPools } = useGenerateLeverageData(tradeType, showAllPool)
  const { pools } = useResource()
  const { baseRate, sideRate, cRate, interest, premium, fundingRate, interestRate, maxPremiumRate } = usePoolRate(inputTokenAddress, outputTokenAddress, pools, pools[outputTokenAddress])
  const { rateData, loading: rateDataLoading, error: rateDataError } = useCalculatePara({
    inputTokenAddress,
    outputTokenAddress: pools[outputTokenAddress]?.TOKEN_R,
    amountIn: amountIn
  })

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
      setChartTab(CHART_TABS.LAST_TRADE_CHART)
    }

    setTradeType(tradeType)
  }, [tradeType])

  useEffect(() => {
    if (barData.token) {
      setOutputTokenAddress(barData.token)
      setCurrentPoolAddress(decodeErc1155Address(barData.token).address)
    }
  }, [barData])

  const { submitFetcherV2, callError, loading, gasUsed, amountOut, payloadAmountIn } =
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
  }, [outputTokenAddress, inputTokenAddress, leverageData, pools, id])

  const { value: valueIn } = useTokenValue({
    amount: amountIn,
    tokenAddress: inputTokenAddress
  })

  const { value: valueOut } = useTokenValue({
    amount: amountOut,
    tokenAddress: outputTokenAddress
  })

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

  const payoffRate = useMemo(() => {
    const _valueIn = Number(valueIn) === 0 ? rateData?.priceRoute?.srcUSD || 0 : valueIn
    if (valueOut && _valueIn && Number(valueOut) && Number(_valueIn)) {
      return NUM(div(valueOut, _valueIn))
    }
    return undefined
  }, [valueIn, valueOut, rateData])

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

  const tokensToSelect = useMemo(() => {
    if (!id || !poolToShow?.TOKEN_R) return []
    const tokenRs = Object.keys(tokens).filter((address) => !isErc1155Address(address))
    return _.uniq(
      tokenRs.filter((address) => {
        return balances[address]?.gt(0)
      })
    )
  }, [routes, tokens, balances, id])

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

  const [effectiveLeverage, leverageKey, leverageValue] = useMemo(() => {
    if (!poolToShow || sideToShow == null) {
      return [0, '', null]
    }

    const {
      leverage,
      effectiveLeverage,
      dgA,
      dgB,
    } = calcPoolSide(poolToShow, sideToShow, tokens)

    if (sideToShow != POOL_IDS.C && effectiveLeverage < leverage) {
      const CompText = effectiveLeverage < leverage / 2 ? TextSell : TextWarning
      return [
        effectiveLeverage,
        'Effective Leverage',
        <CompText>{zerofy(effectiveLeverage)}x</CompText>
      ]
    }

    const title = sideToShow == POOL_IDS.C ? 'Full Leverage Range' : 'Deleverage Price'
    return [
      effectiveLeverage,
      title,
      <DeleveragePrice
        position={{
          side: sideToShow,
          leverage,
          effectiveLeverage,
          dgA,
          dgB,
        }}
        isPhone
      />
    ]
  }, [poolToShow, sideToShow, tokens])

  const power = useMemo(() => {
    if (!poolToShow) {
      return 1
    }
    return getPoolPower(poolToShow)
  }, [poolToShow])

  const interestRef = useRef(interest)
  interestRef.current = interest
  const premiumRef = useRef(premium)

  useEffect(() => {
    if (tokensToSelect.length > 0 && !tokensToSelect.includes(inputTokenAddress)) {
      setInputTokenAddress(tokensToSelect.includes(NATIVE_ADDRESS) ? NATIVE_ADDRESS : tokensToSelect[0])
    }
  }, [tokensToSelect, inputTokenAddress])

  const shouldShowLevelMap = useMemo(() => {
    const nBars = leverageData.reduce((acc: number, l:any) => acc + l.bars.length as number, 0) as number || 0
    return nBars > 1
  }, [leverageData])

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
            <span className='d-flex align-items-center gap-05'>
              <TokenIcon size={24} tokenAddress={inputTokenAddress} />
              <Text>
                <TokenSymbol token={inputTokenAddress} />
              </Text>
            </span>
          </span>
          <div className='d-flex align-item-center'>
            <Text
              className='amount-input-box__head--balance'
              onClick={() => {
                setAmountIn(
                  IEW(
                    balances[inputTokenAddress],
                    tokens[inputTokenAddress]?.decimals || 18
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
                        tokens[inputTokenAddress]?.decimals ?? 18
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
        <div className='icon-arrow-down-wrap pl-5 mt-1 mb-2'>
          <span >
            <IconArrowDown fill='#01A7FA' />
          </span>
        </div>
      )}

      <EstimateBox
        outputTokenAddress={outputTokenAddress}
        tradeType={tradeType}
        amountIn={amountIn}
        amountOut={amountOut}
        valueOut={valueOut}
        power={power}/>
      <div style={{ width: '100%', textAlign: 'center', height: 'auto', overflow: 'hidden' }}>
        <span >
          {isLoadingIndex ? <SvgSpinners12DotsScaleRotate className='text-blue'/> : <TextLink className='show-all-pool-text' onClick={() => {
            if (setShowAllPool)setShowAllPool(!showAllPool)
          }}>{
              totalHiddenPools !== 0
                ? (showAllPool ? `Hide ${totalHiddenPools} low liquidity pools` : `Show ${totalHiddenPools} hidden pools`) : ''}</TextLink>}
        </span>
      </div>
      {leverageData.length > 0 && (
        <div className={!shouldShowLevelMap ? 'hidden' : ''}>
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

      <SwapInfoBox
        tradeType={tradeType}
        poolToShow={poolToShow}
        effectiveLeverage={effectiveLeverage}
        baseRate={baseRate}
        sideRate={sideRate}
        cRate={cRate}
        interest={interest}
        premium={premium}
        maxPremiumRate={maxPremiumRate}
        interestRate={interestRate}
        fundingRate={fundingRate}
        leverageKey={leverageKey}
        leverageValue={leverageValue}/>

      {Number(amountIn) > 0 && gasUsed?.gt(0) &&
      <TxFee
        gasUsed={gasUsed}
        payoffRate={payoffRate}
        loading={loading && Number(amountIn) > 0}
      />
      }

      <div className='actions'>
        <ButtonSwap
          submitFetcherV2={submitFetcherV2}
          payoffRate={payoffRate}
          inputTokenAddress={inputTokenAddress}
          outputTokenAddress={outputTokenAddress}
          amountIn={amountIn}
          payloadAmountIn={payloadAmountIn}
          amountOut={amountOut}
          callError={(!valueIn && loading) ? rateDataError : callError}
          gasUsed={gasUsed}
          tradeType={tradeType}
          loadingAmountOut={loading || rateDataLoading}
          tokenOutMaturity={tokenOutMaturity}
          setVisibleSettingModal={setVisibleSettingModal}
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
