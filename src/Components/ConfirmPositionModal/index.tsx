import { BigNumber } from 'ethers'
import 'rc-slider/assets/index.css'
import React, { Fragment, useMemo } from 'react'
import isEqual from 'react-fast-compare'
import { useCurrentPoolGroup } from '../../state/currentPool/hooks/useCurrentPoolGroup'
import { useResource } from '../../state/resources/hooks/useResource'
import { useListTokens } from '../../state/token/hook'
import { useWalletBalance } from '../../state/wallet/hooks/useBalances'
import { POOL_IDS, TRADE_TYPE } from '../../utils/constant'
import {
  IEW,
  NUM,
  bn,
  decodeErc1155Address,
  div,
  formatFloat,
  isErc1155Address,
  kx,
  xr,
  zerofy
} from '../../utils/helpers'
import { ButtonSwap } from '../ButtonSwap'
import { EstimateBox } from '../BuyPositionBox/components/EstimateBox'
import { TxFee } from '../SwapBox/components/TxFee'
import { useTokenValue } from '../SwapBox/hooks/useTokenValue'
import { IconArrowDown } from '../ui/Icon'
import { Modal } from '../ui/Modal'
import { Text, TextError, TextGrey, TextWarning } from '../ui/Text'
import { TokenSymbol } from '../ui/TokenSymbol'
import { SwapModalHeaderAmount } from './components/SwapModalHeaderAmount'
import './style.scss'
import { SwapInfoBox } from '../BuyPositionBox/components/SwapInfoBox'
import { Q256 } from '../../utils/type'

const Component = ({
  submitFetcherV2,
  visible,
  setVisible,
  inputTokenAddress,
  outputTokenAddress,
  amountIn,
  amountOut,
  callError,
  gasUsed,
  callback,
  tradeType = TRADE_TYPE.LONG,
  loadingAmountOut,
  payloadAmountIn,
  payoffRate,
  tokenOutMaturity,
  confirmModal,
  setVisibleSettingModal,
  title
}: {
  submitFetcherV2: boolean
  visible: boolean
  setVisible: any
  inputTokenAddress: string
  outputTokenAddress: string
  amountIn: string
  amountOut: string
  callError: string
  payloadAmountIn?: BigNumber
  gasUsed: BigNumber
  callback?: any
  loadingAmountOut?: boolean
  tradeType?: TRADE_TYPE
  payoffRate?: number
  tokenOutMaturity: BigNumber
  confirmModal?: Boolean
  setVisibleSettingModal?: React.Dispatch<React.SetStateAction<boolean>>,
  title?: string
}) => {
  const { tokens } = useListTokens()
  const { pools } = useResource()
  const { basePrice } = useCurrentPoolGroup()
  const { getTokenValue } = useTokenValue({})
  const { balances } = useWalletBalance()
  const ConfirmInfo = () => {
    if (tradeType === TRADE_TYPE.SWAP) {
      const valueIn = getTokenValue(inputTokenAddress, amountIn)
      const valueOut = getTokenValue(outputTokenAddress, amountOut)
      return (
        <div>
          <div className='amount-input-box'>

            <SwapModalHeaderAmount textBefore='Pay' amountIn={amountIn} valueIn={valueIn} tokenAddress={inputTokenAddress}/>
            <div className='text-center mt-2 mb-1'>
              <span>
                <IconArrowDown fill='#01A7FA' />
              </span>
            </div>

            <SwapModalHeaderAmount textBefore='Receive' amountIn={amountOut} valueIn={valueOut} tokenAddress={outputTokenAddress}/>
          </div>
        </div>
      )
    } else {
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

      const power = useMemo(() => {
        if (!poolToShow) {
          return 1
        }
        return poolToShow.k.toNumber() / 2
      }, [poolToShow])

      const liquidity = getTokenValue(
        poolToShow?.TOKEN_R,
        IEW(poolToShow?.states?.R, tokens[poolToShow?.TOKEN_R]?.decimals)
      )
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
        const kB = kx(-k, R, b, spot, MARK)
        const ek =
          sideToShow === POOL_IDS.A ? kA : sideToShow === POOL_IDS.B ? kB : k

        if (ek < k) {
          const power = formatFloat(ek / 2, 2)
          return [
            'Effective Leverage',
            ek < k / 2 ? (
              <TextError>{power}x</TextError>
            ) : (
              <TextWarning>{power}x</TextWarning>
            )
          ]
        }

        let mark = 1
        if (MARK) {
          let M = MARK.mul(MARK)
          const decimalsOffset =
            (tokens?.[baseToken]?.decimals ?? 18) -
            (tokens?.[quoteToken]?.decimals ?? 18)
          const unit = bn(10).pow(Math.abs(decimalsOffset))
          if (decimalsOffset > 0) {
            M = M.mul(unit)
          } else if (decimalsOffset < 0) {
            M = M.div(unit)
          }
          mark = NUM(div(M, Q256))
        }

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

      const valueOut = getTokenValue(outputTokenAddress, amountOut)
      const valueIn = getTokenValue(inputTokenAddress, amountIn)
      return (
        <div>
          {inputTokenAddress && (
            <div>
              <SwapModalHeaderAmount textBefore='Pay' amountIn={amountIn} valueIn={valueIn} tokenAddress={inputTokenAddress}/>
              <div className='text-center mt-1 mb-3'>
                <span>
                  <IconArrowDown fill='#01A7FA' />
                </span>
              </div>
              <EstimateBox
                outputTokenAddress={outputTokenAddress}
                tradeType={tradeType}
                amountIn={amountIn}
                amountOut={amountOut}
                valueOut={valueOut}
                power={power}/>

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
            </div>
          )}
        </div>
      )
    }
  }
  if (!visible) return <Fragment/>
  return (
    <Modal
      setVisible={setVisible}
      visible={visible}
      title={title || (String(balances[outputTokenAddress]) === '0' ? 'Confirm Position' : 'Increase Position')}
    >
      <div className='close-position-modal'>
        <ConfirmInfo />
        <TxFee
          gasUsed={gasUsed}
          payoffRate={payoffRate}
          loading={loadingAmountOut && Number(amountIn) > 0}
        />
        <div className='actions'>
          <ButtonSwap
            submitFetcherV2={submitFetcherV2}
            loadingAmountOut={loadingAmountOut}
            payoffRate={payoffRate}
            inputTokenAddress={inputTokenAddress}
            payloadAmountIn={payloadAmountIn}
            tradeType={tradeType}
            outputTokenAddress={outputTokenAddress}
            closeConfirmWhenSwap={() => setVisible(false)}
            amountIn={amountIn}
            amountOut={amountOut}
            callError={callError}
            gasUsed={gasUsed}
            tokenOutMaturity={tokenOutMaturity}
            setVisibleSettingModal={setVisibleSettingModal}
            title={
              tradeType === TRADE_TYPE.SWAP ? 'Swap' : (Number(decodeErc1155Address(outputTokenAddress).id) ===
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
                  ))
            }
          />
        </div>
      </div>
    </Modal>
  )
}

export const ConfirmPosition = React.memo(Component, (prevProps, nextProps) =>
  isEqual(prevProps, nextProps)
)
