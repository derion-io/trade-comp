import { BigNumber } from 'ethers'
import LeverageSlider from 'leverage-slider/dist/component'
import _ from 'lodash'
import 'rc-slider/assets/index.css'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import isEqual from 'react-fast-compare'
import { useGenerateLeverageData } from '../../hooks/useGenerateLeverageData'
import { useListTokenHasUniPool } from '../../hooks/useListTokenHasUniPool'
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
  IEW,
  NUM,
  calcPoolSide,
  decodeErc1155Address,
  div,
  formatFloat,
  getPoolPower,
  isErc1155Address,
  zerofy
} from '../../utils/helpers'
import { ApproveUtrModal } from '../ApproveUtrModal'
import { ButtonSwap } from '../ButtonSwap'
import { SelectTokenModal } from '../SelectTokenModal'
import { TxFee } from '../SwapBox/components/TxFee'
import { useCalculateSwap } from '../SwapBox/hooks/useCalculateSwap'
import { useTokenValue } from '../SwapBox/hooks/useTokenValue'
import { IconArrowDown } from '../ui/Icon'
import NumberInput from '../ui/Input/InputNumber'
import { Text, TextGrey, TextSell, TextWarning } from '../ui/Text'
import { TokenIcon } from '../ui/TokenIcon'
import { TokenSymbol } from '../ui/TokenSymbol'
import { EstimateBox } from './components/EstimateBox'
import { SwapInfoBox } from './components/SwapInfoBox'
import { DeleveragePrice } from '../Positions'
import './style.scss'

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
  }, [outputTokenAddress, inputTokenAddress, pools, id])

  const { value: valueIn } = useTokenValue({
    amount: amountIn,
    tokenAddress: inputTokenAddress
  })

  const { value: valueOut } = useTokenValue({
    amount: amountOut,
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

    if (poolToShow.TOKEN_R === configs.wrappedTokenAddress || erc20TokenSupported.includes(configs.wrappedTokenAddress)) {
      tokenRs.push(NATIVE_ADDRESS)
    }

    return _.uniq(
      [...tokenRs, ...erc20TokenSupported].filter((address) => {
        if (tokenRs.includes(address)) return true
        return balances[address]?.gt(0)
      })
    )
  }, [erc20TokenSupported, routes, balances, id])

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

  const [leverageKey, leverageValue] = useMemo(() => {
    if (!poolToShow || sideToShow == null) {
      return ['', null]
    }

    const {
      leverage,
      effectiveLeverage,
      dgA,
      dgB
    } = calcPoolSide(poolToShow, sideToShow, tokens)

    if (sideToShow != POOL_IDS.C && effectiveLeverage < leverage) {
      const CompText = effectiveLeverage < leverage / 2 ? TextSell : TextWarning
      return [
        'Effective Leverage',
        <CompText>{zerofy(effectiveLeverage)}x</CompText>
      ]
    }

    const title = sideToShow == POOL_IDS.C ? 'Full Leverage Range' : 'Deleverage Price'
    return [
      title,
      <DeleveragePrice
        position={{
          side: sideToShow,
          leverage,
          effectiveLeverage,
          dgA,
          dgB
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
    if (tokensToSelect.length > 0 && !tokensToSelect.includes(inputTokenAddress)) {
      setInputTokenAddress(tokensToSelect.includes(NATIVE_ADDRESS) ? NATIVE_ADDRESS : tokensToSelect[0])
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
        <div className='pl-5 mt-1 mb-2'>
          <IconArrowDown fill='#01A7FA' />
        </div>
      )}

      <EstimateBox
        outputTokenAddress={outputTokenAddress}
        tradeType={tradeType}
        amountIn={amountIn}
        amountOut={amountOut}
        valueOut={valueOut}
        power={power}/>

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

      <SwapInfoBox
        tradeType={tradeType}
        poolToShow={poolToShow}
        interest={interest}
        premium={premium}
        maxPremiumRate={maxPremiumRate}
        interestRate={interestRate}
        fundingRate={fundingRate}
        leverageKey={leverageKey}
        leverageValue={leverageValue}/>

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
          submitFetcherV2={submitFetcherV2}
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
