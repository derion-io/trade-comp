import React from 'react'
import { Modal } from '../ui/Modal'
import { Box } from '../ui/Box'
import { useListTokens } from '../../state/token/hook'
import { TokenIcon } from '../ui/TokenIcon'
import { useWalletBalance } from '../../state/wallet/hooks/useBalances'
import { TokenSymbol } from '../ui/TokenSymbol'
import { Text } from '../ui/Text'
import './style.scss'
import { formatWeiToDisplayNumber } from '../../utils/formatBalance'
import isEqual from 'react-fast-compare'

const Component = ({
  visible,
  setVisible,
  tokens: tokensToSelect,
  onSelectToken,
  displayFee = false
}: {
  visible: boolean,
  setVisible: any,
  tokens: string[],
  onSelectToken: any,
  displayFee?: boolean
}) => {
  // const { pair, TOKEN_R } = useCurrentPool()
  const { tokens } = useListTokens()
  const { balances } = useWalletBalance()

  return <Modal
    setVisible={setVisible}
    visible={visible}
    title='Select token'
  >
    <div className='select-token-modal'>
      {
        tokensToSelect.map((address: any, key: number) => {
          const fee: string | any = ''
          const symbol = <TokenSymbol token={tokens[address]} />
          return <Box
            key={key}
            className='option'
            onClick={() => {
              onSelectToken(address)
              setVisible(false)
            }}
          >
            <div className='jc-space-between align-item-center'>
              <div className='option__icon-and-name'>
                <TokenIcon size={24} tokenAddress={address} />
                <Text>{symbol}</Text>
                {fee}
              </div>
              <span>
                {balances && balances[address]
                  ? formatWeiToDisplayNumber(
                    balances[address],
                    4,
                    tokens[address]?.decimal || 18
                  )
                  : 0}
              </span>
            </div>
          </Box>
        })
      }
    </div>
  </Modal>
}

export const SelectTokenModal = React.memo(Component, (prevProps, nextProps) =>
  isEqual(prevProps, nextProps)
)
