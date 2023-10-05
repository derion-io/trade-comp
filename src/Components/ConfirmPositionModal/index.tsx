import { BigNumber } from 'ethers'
import 'rc-slider/assets/index.css'
import React, { useMemo } from 'react'
import isEqual from 'react-fast-compare'
import { useCurrentPoolGroup } from '../../state/currentPool/hooks/useCurrentPoolGroup'
import { useResource } from '../../state/resources/hooks/useResource'
import { useListTokens } from '../../state/token/hook'
import { useWalletBalance } from '../../state/wallet/hooks/useBalances'
import { POOL_IDS, TRADE_TYPE } from '../../utils/constant'
import formatLocalisedCompactNumber from '../../utils/formatBalance'
import {
  IEW,
  decodeErc1155Address,
  formatFloat,
  isErc1155Address,
  zerofy
} from '../../utils/helpers'
import { ButtonSwap } from '../ButtonSwap'
import { EstimateBox } from '../BuyPositionBox/components/EstimateBox'
import { TxFee } from '../SwapBox/components/TxFee'
import { useTokenValue } from '../SwapBox/hooks/useTokenValue'
import { Box } from '../ui/Box'
import { IconArrowDown } from '../ui/Icon'
import { InfoRow } from '../ui/InfoRow'
import { Modal } from '../ui/Modal'
import { SkeletonLoader } from '../ui/SkeletonLoader'
import { Text, TextGrey } from '../ui/Text'
import { TokenSymbol } from '../ui/TokenSymbol'
import { SwapModalHeaderAmount } from './components/SwapModalHeaderAmount'
import './style.scss'

const Component = ({
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
  title
}: {
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
      const [poolToShow] = useMemo(() => {
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

              <Box
                borderColor='default'
                className='swap-info-box mt-1 mb-1 no-wrap'
              >
                <InfoRow>
                  <TextGrey>Liquidity</TextGrey>
                  <SkeletonLoader loading={!liquidity || liquidity === '0'}>
                    <Text>
                      ${formatLocalisedCompactNumber(formatFloat(liquidity, 2))}
                    </Text>
                  </SkeletonLoader>
                </InfoRow>
                <InfoRow>
                  <TextGrey>Entry Price</TextGrey>
                  <SkeletonLoader loading={!liquidity || liquidity === '0'}>
                    <Text>{zerofy(formatFloat(basePrice))}</Text>
                  </SkeletonLoader>
                </InfoRow>
              </Box>
            </div>
          )}
        </div>
      )
    }
  }
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
            loadingAmountOut={loadingAmountOut}
            payoffRate={payoffRate}
            inputTokenAddress={inputTokenAddress}
            payloadAmountIn={payloadAmountIn}
            tradeType={tradeType}
            outputTokenAddress={outputTokenAddress}
            amountIn={amountIn}
            amountOut={amountOut}
            callError={callError}
            gasUsed={gasUsed}
            tokenOutMaturity={tokenOutMaturity}
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
