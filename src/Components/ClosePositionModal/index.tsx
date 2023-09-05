import React, { useEffect, useMemo, useState } from 'react'
import { Modal } from '../ui/Modal'
import { useListTokens } from '../../state/token/hook'
import { TokenIcon } from '../ui/TokenIcon'
import { useWalletBalance } from '../../state/wallet/hooks/useBalances'
import { TokenSymbol } from '../ui/TokenSymbol'
import { Text, TextGrey } from '../ui/Text'
import './style.scss'
import formatLocalisedCompactNumber, {
  formatWeiToDisplayNumber
} from '../../utils/formatBalance'
import isEqual from 'react-fast-compare'
import {
  decodeErc1155Address,
  div,
  formatFloat,
  formatPercent,
  weiToNumber
} from '../../utils/helpers'
import { SkeletonLoader } from '../ui/SkeletonLoader'
import { Input } from '../ui/Input'
import { useWeb3React } from '../../state/customWeb3React/hook'
import { useTokenValue } from '../SwapBox/hooks/useTokenValue'
import { IconArrowDown } from '../ui/Icon'
import { InfoRow } from '../ui/InfoRow'
import { PoolInfo } from '../SwapBox/components/PoolInfo'
import { TxFee } from '../SwapBox/components/TxFee'
import { useCalculateSwap } from '../SwapBox/hooks/useCalculateSwap'
import { ButtonSwap } from '../ButtonSwap'
import { POOL_IDS } from '../../utils/constant'
import { BigNumber } from 'ethers'
import { useSettings } from '../../state/setting/hooks/useSettings'
import { useCurrentPoolGroup } from '../../state/currentPool/hooks/useCurrentPoolGroup'

const Component = ({
  visible,
  setVisible,
  inputTokenAddress,
  outputTokenAddress,
  title,
  tokenOutMaturity
}: {
  visible: boolean
  setVisible: any
  inputTokenAddress: string
  outputTokenAddress: string
  title: any
  tokenOutMaturity: BigNumber
}) => {
  const { pools } = useCurrentPoolGroup()
  const { tokens } = useListTokens()
  const { balances, accFetchBalance } = useWalletBalance()
  const { account } = useWeb3React()
  const [amountIn, setAmountIn] = useState<string>('')
  const { settings } = useSettings()
  const [valueInput, setValueInput] = useState<string>('')

  const [pool, power] = useMemo(() => {
    if (!inputTokenAddress || !pools) {
      return [null, 1]
    }
    const { address, id } = decodeErc1155Address(inputTokenAddress)
    const pool = pools[address]
    if (!pool) {
      return [null, 1]
    }
    const power = Number(id) == POOL_IDS.C ? 1 : pool.k.toNumber() / 2
    return [pool, power]
  }, [inputTokenAddress, pools])

  const balance: string = useMemo(() => {
    return weiToNumber(
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
      return formatPercent(div(valueOut, valueIn), 2, true)
    }
    return undefined
  }, [valueIn, valueOut])

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
                    const balance = weiToNumber(
                      balances[inputTokenAddress],
                      tokens[inputTokenAddress]?.decimal || 18
                    )
                      setAmountIn(balance)
                  }}
                >
                  Balance:{' '}
                  {balances && balances[inputTokenAddress]
                    ? formatWeiToDisplayNumber(
                        balances[inputTokenAddress],
                        4,
                        tokens[inputTokenAddress]?.decimal || 18
                      )
                    : 0}
                </Text>
              ) : (
                <Text
                  className='amount-input-box__head--balance'
                  onClick={() => {
                    setValueInput(valueBalance == valueIn ? '' : valueBalance)
                  }}
                >
                  {power > 1 ? 'Size:' : 'Value:'} $
                  {formatLocalisedCompactNumber(formatFloat(valueBalance ?? 0))}
                </Text>
              )}
            </SkeletonLoader>
          </InfoRow>
          {settings.showBalance ? (
            <Input
              placeholder='0.0'
              isNumber
              suffix={

                Number(valueIn) > 0 ? (
                  <TextGrey>
                    ${formatLocalisedCompactNumber(formatFloat(valueIn))}
                  </TextGrey>
                ) : (
                  ''
                )
              }
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
          ) : (
            <Input
              placeholder='0'
              prefix='$'
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
              className='fs-24'
              value={valueInput}
              onChange={(e) => {
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
          )}
        </div>

        <PoolInfo
          outputTokenAddress={outputTokenAddress}
          inputTokenAddress={inputTokenAddress}
        />

        <div className='text-center mt-1 mb-1'>
          <IconArrowDown fill='#01A7FA' />
        </div>

        <div className='amount-input-box'>
          <InfoRow className='amount-input-box__head mb-1'>
            <SkeletonLoader loading={!tokens[outputTokenAddress]}>
              <span className='d-flex align-items-center gap-05'>
                <TokenIcon size={24} tokenAddress={outputTokenAddress} />
                <Text>
                  <TokenSymbol token={outputTokenAddress} />
                </Text>
              </span>
            </SkeletonLoader>
            <SkeletonLoader loading={accFetchBalance !== account}>
              <Text className='amount-input-box__head--balance'>
                Balance:{' '}
                {balances && balances[outputTokenAddress]
                  ? formatWeiToDisplayNumber(
                      balances[outputTokenAddress],
                      4,
                      tokens[outputTokenAddress]?.decimal || 18
                    )
                  : 0}
              </Text>
            </SkeletonLoader>
          </InfoRow>
          <Input
            placeholder='0.0'
            isNumber
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
            // @ts-ignore
            value={amountOut}
          />
        </div>

        <TxFee gasUsed={gasUsed} payoffRate={payoffRate} loading={loading} />

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
            callback={() => {
              setVisible(false)
            }}
            isClose
            title={title}
          />
        </div>
      </div>
    </Modal>
  )
}

export const ClosePosition = React.memo(Component, (prevProps, nextProps) =>
  isEqual(prevProps, nextProps)
)
