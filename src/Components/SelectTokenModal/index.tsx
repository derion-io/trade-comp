import React from 'react'
import { Modal } from '../ui/Modal'
import { Box } from '../ui/Box'
import { useListTokens } from '../../state/token/hook'
import { TokenIcon } from '../ui/TokenIcon'
import { useWalletBalance } from '../../state/wallet/hooks/useBalances'
import { weiToNumber } from '../../utils/helpers'

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
  >
    {
      tokensToSelect.map((address: any, key: number) => {
        return <Box key={key} onClick={() => {
          onSelectToken(address)
          setVisible(false)
        }}
        >
          <div className='jc-space-between align-item-center'>
            <div>
              <TokenIcon size={24} tokenAddress={address} />
              <span>{tokens[address]?.symbol}</span>
            </div>
            <span>{weiToNumber(balances[address], tokens[address]?.decimal || 18)}</span>
          </div>

        </Box>
      })
    }

  </Modal>
}
