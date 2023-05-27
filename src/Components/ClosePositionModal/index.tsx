import React, { useMemo, useState } from 'react'
import { Modal } from '../ui/Modal'
import { Box } from '../ui/Box'
import { useListTokens } from '../../state/token/hook'
import { TokenIcon } from '../ui/TokenIcon'
import { useWalletBalance } from '../../state/wallet/hooks/useBalances'
import { TokenSymbol } from '../ui/TokenSymbol'
import { Text, TextGrey } from '../ui/Text'
import './style.scss'
import { formatWeiToDisplayNumber } from '../../utils/formatBalance'
import isEqual from 'react-fast-compare'
import { useListPool } from '../../state/resources/hooks/useListPool'
import { bn, decodeErc1155Address, div, isErc1155Address, numberToWei, weiToNumber } from '../../utils/helpers'
import { POOL_IDS } from '../../utils/constant'
import { SkeletonLoader } from '../ui/SkeletonLoader'
import { Input } from '../ui/Input'
import { useWeb3React } from '../../state/customWeb3React/hook'
import { useTokenValue } from '../SwapBox/hooks/useTokenValue'
import { IconArrowDown } from '../ui/Icon'

const Component = ({
  visible,
  setVisible,
  inputTokenAddress,
  outputTokenAddress
}: {
  visible: boolean,
  setVisible: any,
  dToken: string
  inputTokenAddress: string,
  outputTokenAddress: string
}) => {
  const { tokens } = useListTokens()
  const { balances, accFetchBalance } = useWalletBalance()
  const { account } = useWeb3React()
  const [amountIn, setAmountIn] = useState<string>('')

  const valueIn = useTokenValue({
    amount: bn(numberToWei(amountIn, tokens[inputTokenAddress]?.decimal || 18)),
    token: inputTokenAddress
  })

  return <Modal
    setVisible={setVisible}
    visible={visible}
    title='Close position'
  >
    <div className='close-position-modal'>
      <div className='amount-input-box'>
        <div className='amount-input-box__head'>
          <SkeletonLoader loading={!tokens[inputTokenAddress]}>
            <span
              className='current-token'
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
        </div>
        <Input
          placeholder='0.0'
          suffix={valueIn > 0 ? <TextGrey>${valueIn}</TextGrey> : ''}
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

    </div>
  </Modal>
}

export const ClosePosition = React.memo(Component, (prevProps, nextProps) =>
  isEqual(prevProps, nextProps)
)
