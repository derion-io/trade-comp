import React from 'react'
import { Modal } from '../ui/Modal'
import { Box } from '../ui/Box'
import { useListTokens } from '../../state/token/hook'
import { TokenIcon } from '../ui/TokenIcon'
import { useWalletBalance } from '../../state/wallet/hooks/useBalances'
import { weiToNumber } from '../../utils/helpers'
import { TokenSymbol } from '../ui/TokenSymbol'
import { Text } from '../ui/Text'
import './style.scss'

export const SelectTokenModal = ({
  visible,
  setVisible,
  tokens: tokensToSelect,
  onSelectToken
}: any) => {
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
                <Text><TokenSymbol token={tokens[address]} /></Text>
              </div>
              <span>{weiToNumber(balances[address], tokens[address]?.decimal || 18)}</span>
            </div>

          </Box>
        })
      }
    </div>
  </Modal>
}
