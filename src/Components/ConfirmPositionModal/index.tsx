import { BigNumber } from 'ethers'
import 'rc-slider/assets/index.css'
import React, { useMemo } from 'react'
import isEqual from 'react-fast-compare'
import { useCurrentPoolGroup } from '../../state/currentPool/hooks/useCurrentPoolGroup'
import { useResource } from '../../state/resources/hooks/useResource'
import { useSettings } from '../../state/setting/hooks/useSettings'
import { useListTokens } from '../../state/token/hook'
import { useWalletBalance } from '../../state/wallet/hooks/useBalances'
import { POOL_IDS, TRADE_TYPE } from '../../utils/constant'
import formatLocalisedCompactNumber, {
  formatWeiToDisplayNumber
} from '../../utils/formatBalance'
import {
  IEW,
  bn,
  decodeErc1155Address,
  formatFloat,
  getTitleBuyTradeType,
  isErc1155Address,
  whatDecimalSeparator,
  zerofy
} from '../../utils/helpers'
import { ButtonSwap } from '../ButtonSwap'
import { TxFee } from '../SwapBox/components/TxFee'
import { useTokenValue } from '../SwapBox/hooks/useTokenValue'
import { Box } from '../ui/Box'
import { IconArrowDown } from '../ui/Icon'
import { InfoRow } from '../ui/InfoRow'
import { Modal } from '../ui/Modal'
import { SkeletonLoader } from '../ui/SkeletonLoader'
import { Text, TextGrey } from '../ui/Text'
import { TokenIcon } from '../ui/TokenIcon'
import { TokenSymbol } from '../ui/TokenSymbol'
import './style.scss'
import { SwapModalHeaderAmount } from './components/SwapModalHeaderAmount'

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
  const { settings } = useSettings()
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
      const showSize =
        tradeType === TRADE_TYPE.LONG || tradeType === TRADE_TYPE.SHORT
      const valueOutBefore = getTokenValue(
        inputTokenAddress,
        IEW(
          balances[outputTokenAddress],
          tokens[outputTokenAddress]?.decimal || 18
        )
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
                  <SkeletonLoader
                    loading={balances[outputTokenAddress] == null}
                  >
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
                            {zerofy(formatFloat(valueOutBefore)).match(
                              /\.\d+$/g
                            ) || '\u00A0'}
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
