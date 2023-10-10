import { BigNumber } from 'ethers'
import _ from 'lodash'
import React, { useEffect, useMemo, useState } from 'react'
import isEqual from 'react-fast-compare'
import { useListTokenHasUniPool } from '../../hooks/useListTokenHasUniPool'
import { useConfigs } from '../../state/config/useConfigs'
import { useCurrentPoolGroup } from '../../state/currentPool/hooks/useCurrentPoolGroup'
import { useWeb3React } from '../../state/customWeb3React/hook'
import { useResource } from '../../state/resources/hooks/useResource'
import { useSettings } from '../../state/setting/hooks/useSettings'
import { useListTokens } from '../../state/token/hook'
import { useWalletBalance } from '../../state/wallet/hooks/useBalances'
import {
  MIN_POSITON_VALUE_USD_TO_DISPLAY, NATIVE_ADDRESS,
  PERCENTAGE_SUGGESTIONS,
  POOL_IDS
} from '../../utils/constant'
import { formatLocalisedCompactNumber } from '../../utils/formatBalance'
import {
  IEW,
  NUM,
  decodeErc1155Address,
  div,
  formatFloat,
  formatPercent,
  zerofy
} from '../../utils/helpers'
import { Position } from '../../utils/type'
import { ButtonSwap } from '../ButtonSwap'
import { VALUE_IN_USD_STATUS } from '../Positions'
import { SelectTokenModal } from '../SelectTokenModal'
import { TxFee } from '../SwapBox/components/TxFee'
import { useCalculateSwap } from '../SwapBox/hooks/useCalculateSwap'
import { useTokenValue } from '../SwapBox/hooks/useTokenValue'
import Tooltip from '../Tooltip/Tooltip'
import { IconArrowDown } from '../ui/Icon'
import { InfoRow } from '../ui/InfoRow'
import NumberInput from '../ui/Input/InputNumber'
import { Modal } from '../ui/Modal'
import { SkeletonLoader } from '../ui/SkeletonLoader'
import { Text, TextGrey } from '../ui/Text'
import { TokenIcon } from '../ui/TokenIcon'
import { TokenSymbol } from '../ui/TokenSymbol'
import { PositionInfo } from './components/PositionInfo'
import './style.scss'

const Component = ({
  visible,
  setVisible,
  position,
  outputTokenAddress,
  setOutputTokenAddress,
  title,
  tokenOutMaturity,
  valueInUsdStatus,
  setValueInUsdStatus
}: {
  visible: boolean
  setVisible: any
  position: Position
  outputTokenAddress: string
  setOutputTokenAddress: any
  title: any
  tokenOutMaturity: BigNumber
  valueInUsdStatus: VALUE_IN_USD_STATUS
  setValueInUsdStatus: (value: VALUE_IN_USD_STATUS) => void
}) => {
  const inputTokenAddress = position.token
  const { id } = useCurrentPoolGroup()
  const { pools } = useResource()
  const { tokens } = useListTokens()
  const { balances, accFetchBalance } = useWalletBalance()
  const { account } = useWeb3React()
  const [amountIn, setAmountIn] = useState<string>('')
  const { settings } = useSettings()
  const [valueInput, setValueInput] = useState<string>('')
  const [visibleSelectTokenModal, setVisibleSelectTokenModal] =
    useState<boolean>(false)
  const [externalTrigger, setExternalTrigger] = useState<boolean>(false)
  const { configs } = useConfigs()

  const [pool, power] = useMemo(() => {
    if (!inputTokenAddress || !pools) {
      return [null, 1]
    }
    const { address, id } = decodeErc1155Address(inputTokenAddress)
    const pool = pools[address]
    if (!pool) {
      return [null, 1]
    }
    const power = Number(id) === POOL_IDS.C ? 1 : pool.k.toNumber() / 2
    return [pool, power]
  }, [inputTokenAddress, pools])

  const balance: string = useMemo(() => {
    return IEW(
      balances[inputTokenAddress] ?? 0,
      tokens[inputTokenAddress]?.decimal ?? 18
    )
  }, [tokens, balances, inputTokenAddress])

  const { value: valueBalance } = useTokenValue({
    amount: String(Number(balance) * power),
    tokenAddress: inputTokenAddress
  })

  useEffect(() => {
    if (settings.showBalance) return
    const b = Number(balance)
    const a = (b * Number(valueInput)) / Number(valueBalance)
    if (a == null || Number.isNaN(a)) {
      return
    }
    if (a > 0.999 * b) {
      setAmountIn(balance)
    } else {
      setAmountIn(String(a))
    }
  }, [valueInput, balance, valueBalance])

  useEffect(() => {
    if (Number(valueBalance) < MIN_POSITON_VALUE_USD_TO_DISPLAY) {
      setVisible(false)
    }
  }, [valueBalance])

  const { callError, gasUsed, amountOut, loading, payloadAmountIn } =
    useCalculateSwap({
      amountIn,
      setAmountIn,
      inputTokenAddress,
      outputTokenAddress,
      tokenOutMaturity
    })

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

  const { erc20TokenSupported } = useListTokenHasUniPool(pool)

  const tokensToSelect = useMemo(() => {
    if (!id) return []
    const tokenRs = [pool.TOKEN_R]
    if (tokenRs.includes(configs.wrappedTokenAddress) || erc20TokenSupported.includes(configs.wrappedTokenAddress)) {
      tokenRs.push(NATIVE_ADDRESS)
    }
    return _.uniq([...tokenRs, ...erc20TokenSupported])
  }, [erc20TokenSupported, configs.wrappedTokenAddress, pools, id])

  return (
    <Modal
      setVisible={setVisible}
      visible={visible}
      title={
        Number(decodeErc1155Address(inputTokenAddress).id) === POOL_IDS.C
          ? 'Remove Liquidity'
          : 'Close Position'
      }
    >
      <div className='close-position-modal'>
        <div className='amount-input-box'>
          <InfoRow className='amount-input-box__head mb-1'>
            <SkeletonLoader loading={!tokens[inputTokenAddress]}>
              <span className='d-flex align-items-center gap-05'>
                <TokenIcon size={24} tokenAddress={inputTokenAddress} />
                <Text>
                  <TokenSymbol token={inputTokenAddress} />
                </Text>
              </span>
            </SkeletonLoader>
            <SkeletonLoader
              loading={accFetchBalance !== account && valueBalance == null}
            >
              {settings.showBalance ? (
                <Text
                  className='amount-input-box__head--balance'
                  onClick={() => {
                    setExternalTrigger(true)
                    const balance = IEW(
                      balances[inputTokenAddress],
                      tokens[inputTokenAddress]?.decimal || 18
                    )
                    setAmountIn(balance)
                  }}
                >
                  {'Balance: '}
                  {zerofy(
                    formatFloat(
                      IEW(
                        balances?.[inputTokenAddress] ?? 0,
                        tokens[inputTokenAddress]?.decimal ?? 18
                      )
                    )
                  )}
                </Text>
              ) : (
                <Text
                  className='amount-input-box__head--balance'
                  onClick={() => {
                    setExternalTrigger(true)
                    setValueInput(String(formatFloat(valueBalance === valueIn ? '' : valueBalance, undefined, 4, true)))
                  }}
                >
                  {power > 1 ? 'Size:' : 'Value:'} $
                  {formatLocalisedCompactNumber(formatFloat(valueBalance ?? 0))}
                </Text>
              )}
            </SkeletonLoader>
          </InfoRow>
          {settings.showBalance ? (
            <Tooltip
              position='left-bottom'
              wrappedStyle={{ width: '100%', border: 'none', cursor: 'text' }}
              externalTrigger={externalTrigger}
              setExternalTrigger={(et: boolean) => setExternalTrigger(et)}
              handle={
                <NumberInput
                  placeholder='0.0'
                  suffix={
                    Number(valueIn) > 0 ? (
                      <TextGrey>
                    ${formatLocalisedCompactNumber(formatFloat(valueIn))}
                      </TextGrey>
                    ) : (
                      ''
                    )
                  }
                  className='fs-24 w-100'
                  value={amountIn}
                  onValueChange={(e) => {
                    if (Number(e.target.value) >= 0) {
                      setAmountIn((e.target as HTMLInputElement).value)
                    }
                  }}
                />
              }
              trigger='click'
              renderContent={() => (
                <ul className='percent-selector'>
                  {PERCENTAGE_SUGGESTIONS.map((percentage) => (
                    <li
                      className='percent-selector-item'
                      key={percentage}
                      onClick={() => {
                        setExternalTrigger(false)
                        if (percentage === 100) {
                          const balance = IEW(
                            balances[inputTokenAddress],
                          tokens[inputTokenAddress]?.decimal || 18
                          )
                          setAmountIn(balance)
                        } else {
                          const balance = Number(IEW(
                            balances[inputTokenAddress],
                          tokens[inputTokenAddress]?.decimal || 18
                          )) * percentage / 100
                          setAmountIn(String(balance))
                        }
                      }}
                    >
                      {percentage}%
                    </li>
                  ))}
                </ul>
              )}
            />

          ) : (
            <Tooltip
              position='left-bottom'
              wrappedStyle={{ width: '100%', border: 'none', cursor: 'text' }}
              externalTrigger={externalTrigger}
              setExternalTrigger={(et: boolean) => setExternalTrigger(et)}
              handle={
                <NumberInput
                  placeholder='0'
                  prefix='$'
                  className='fs-24 w-100'
                  suffix={
                    Number(amountIn) > 0 ? (
                      <TextGrey>
                        {formatPercent(Number(amountIn) / Number(balance), 2, true)}
                    %
                      </TextGrey>
                    ) : (
                      ''
                    )
                  }
                  value={valueInput}
                  onValueChange={(e) => {
                    const value = (e.target as HTMLInputElement).value
                    if (value != null) {
                      try {
                        if (Number(valueBalance) < Number(value)) {
                          setValueInput(valueBalance)
                          return
                        }
                      } catch (err) {
                        console.error(err)
                      }
                      setValueInput(value)
                    }
                  }}
                />
              }
              trigger='click'
              renderContent={() => (
                <ul className='percent-selector'>
                  {PERCENTAGE_SUGGESTIONS.map((percentage) => (
                    <li
                      className='percent-selector-item'
                      key={percentage}
                      onClick={() => {
                        setExternalTrigger(false)
                        const valueInput = valueBalance === valueIn ? '' : String(Number(valueBalance) * percentage / 100)
                        setValueInput(String(formatFloat(valueInput, undefined, 4, true)))
                      }}
                    >
                      {percentage}%
                    </li>
                  ))}
                </ul>
              )}
            />
          )}
        </div>

        <PositionInfo
          position={position}
          setValueInUsdStatus={setValueInUsdStatus}
          valueInUsdStatus={valueInUsdStatus}
          loading={loading}
        />

        <div className='text-center mt-1 mb-1'>
          <IconArrowDown fill='#01A7FA' />
        </div>

        <div className='amount-input-box'>
          <InfoRow className='amount-input-box__head mb-1 current-token'>
            <SkeletonLoader loading={!tokens[outputTokenAddress]}>
              <span className='d-flex align-items-center gap-05' onClick={() => setVisibleSelectTokenModal(true)}>
                <TokenIcon size={24} tokenAddress={outputTokenAddress} />
                <Text>
                  <TokenSymbol token={outputTokenAddress} />
                </Text>
              </span>
            </SkeletonLoader>
            <SkeletonLoader loading={accFetchBalance !== account}>
              <Text>
                {'Balance: '}
                {zerofy(
                  formatFloat(
                    IEW(
                      balances?.[outputTokenAddress] ?? 0,
                      tokens[outputTokenAddress]?.decimal ?? 18
                    )
                  )
                )}
              </Text>
            </SkeletonLoader>
          </InfoRow>
          <NumberInput
            placeholder='0.0'
            suffix={
              Number(valueOut) > 0 ? (
                <TextGrey>
                  ${formatLocalisedCompactNumber(formatFloat(valueOut))}
                </TextGrey>
              ) : (
                ''
              )
            }
            className='fs-24'
            value={amountOut}
          />
        </div>

        <TxFee
          position={position}
          gasUsed={gasUsed}
          payoffRate={payoffRate}
          isMaxBalance={amountIn === IEW(
            balances[inputTokenAddress],
            tokens[inputTokenAddress]?.decimal || 18
          )}
          loading={loading}
          amountIn={amountIn}
          valueIn={valueIn}
          valueInUsdStatus={valueInUsdStatus}
        />

        <div className='actions'>
          <ButtonSwap
            loadingAmountOut={loading}
            payoffRate={payoffRate}
            inputTokenAddress={inputTokenAddress}
            payloadAmountIn={payloadAmountIn}
            outputTokenAddress={outputTokenAddress}
            amountIn={amountIn}
            amountOut={amountOut}
            callError={callError}
            gasUsed={gasUsed}
            tokenOutMaturity={tokenOutMaturity}
            title={title}
          />
        </div>
      </div>

      <SelectTokenModal
        visible={visibleSelectTokenModal}
        setVisible={setVisibleSelectTokenModal}
        tokens={tokensToSelect}
        onSelectToken={setOutputTokenAddress}
      />

    </Modal>
  )
}

export const ClosePosition = React.memo(Component, (prevProps, nextProps) =>
  isEqual(prevProps, nextProps)
)
