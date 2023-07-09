import React, { useMemo, useState } from 'react'
import { Modal } from '../ui/Modal'
import { useListTokens } from '../../state/token/hook'
import { TokenIcon } from '../ui/TokenIcon'
import { useWalletBalance } from '../../state/wallet/hooks/useBalances'
import { TokenSymbol } from '../ui/TokenSymbol'
import { Text, TextGrey } from '../ui/Text'
import './style.scss'
import formatLocalisedCompactNumber, { formatWeiToDisplayNumber } from '../../utils/formatBalance'
import isEqual from 'react-fast-compare'
import { decodeErc1155Address, div, formatFloat, formatPercent, weiToNumber } from '../../utils/helpers'
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

const Component = ({
  visible,
  setVisible,
  inputTokenAddress,
  outputTokenAddress,
  title
}: {
  visible: boolean,
  setVisible: any,
  inputTokenAddress: string,
  outputTokenAddress: string,
  title: string
}) => {
  const { tokens } = useListTokens()
  const { balances, accFetchBalance } = useWalletBalance()
  const { account } = useWeb3React()
  const [amountIn, setAmountIn] = useState<string>('')

  const { callError, gasUsed, amountOut } = useCalculateSwap({
    amountIn,
    inputTokenAddress,
    outputTokenAddress
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
    if (valueOut && valueIn) {
      return formatPercent(div(valueOut, valueIn), 2)
    }
    return undefined
  }, [valueIn, valueOut])

  return <Modal
    setVisible={setVisible}
    visible={visible}
    title={
      Number(decodeErc1155Address(inputTokenAddress).id) === POOL_IDS.C ? 'Remove Liquidity' : 'Close Position'
    }
  >
    <div className='close-position-modal'>
      <div className='amount-input-box'>
        <InfoRow className='amount-input-box__head mb-1'>
          <SkeletonLoader loading={!tokens[inputTokenAddress]}>
            <span
              className='d-flex align-items-center gap-05'
            >
              <TokenIcon size={24} tokenAddress={inputTokenAddress} />
              <Text><TokenSymbol token={inputTokenAddress} /></Text>
            </span>
          </SkeletonLoader>
          <SkeletonLoader loading={accFetchBalance !== account}>
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
          </SkeletonLoader>
        </InfoRow>
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

      <div className='text-center mt-2 mb-1'>
        <span className='arrow-down' >
          <IconArrowDown fill='#01A7FA' />
        </span>
      </div>

      <div className='amount-input-box'>
        <InfoRow className='amount-input-box__head mb-1'>
          <SkeletonLoader loading={!tokens[outputTokenAddress]}>
            <span
              className='d-flex align-items-center gap-05'
            >
              <TokenIcon size={24} tokenAddress={outputTokenAddress} />
              <Text><TokenSymbol token={outputTokenAddress} /></Text>
            </span>
          </SkeletonLoader>
          <SkeletonLoader loading={accFetchBalance !== account}>
            <Text
              className='amount-input-box__head--balance'
            >Balance: {balances && balances[outputTokenAddress]
                ? formatWeiToDisplayNumber(
                  balances[outputTokenAddress],
                  4,
                tokens[outputTokenAddress]?.decimal || 18
                )
                : 0
              }
            </Text>
          </SkeletonLoader>
        </InfoRow>
        <Input
          placeholder='0.0'
          suffix={Number(valueOut) > 0 ? <TextGrey>${formatLocalisedCompactNumber(formatFloat(valueOut))}</TextGrey> : ''}
          className='fs-24'
          // @ts-ignore
          value={amountOut}
        />
      </div>

      <PoolInfo
        outputTokenAddress={outputTokenAddress}
        inputTokenAddress={inputTokenAddress}
      />
      <TxFee gasUsed={gasUsed} payoffRate={payoffRate} />

      <div className='actions'>
        <ButtonSwap
          payoffRate={payoffRate}
          inputTokenAddress={inputTokenAddress}
          outputTokenAddress={outputTokenAddress}
          amountIn={amountIn}
          callError={callError}
          gasUsed={gasUsed}
          callback={() => {
            setVisible(false)
          }}
          isClose
          title={title}
        />
      </div>
    </div>
  </Modal>
}

export const ClosePosition = React.memo(Component, (prevProps, nextProps) =>
  isEqual(prevProps, nextProps)
)
