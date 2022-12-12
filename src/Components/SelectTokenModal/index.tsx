import React, { Fragment } from 'react'
import { Modal } from '../ui/Modal'
import { Box } from '../ui/Box'
import { useListTokens } from '../../state/token/hook'
import { TokenIcon } from '../ui/TokenIcon'
import { useWalletBalance } from '../../state/wallet/hooks/useBalances'
import { TokenSymbol } from '../ui/TokenSymbol'
import { Text, TextBuy, TextSell } from '../ui/Text'
import './style.scss'
import { useCurrentPool } from '../../state/currentPool/hooks/useCurrentPool'
import { fee10000 } from '../../utils/constant'
import { formatWeiToDisplayNumber } from '../../utils/formatBalance'

export const SelectTokenModal = ({
  visible,
  setVisible,
  tokens: tokensToSelect,
  onSelectToken,
  displayFee
}: {
  visible: boolean,
  setVisible: any,
  tokens: string[],
  onSelectToken: any,
  displayFee: boolean
}) => {
  const { baseToken, quoteToken, cToken } = useCurrentPool()
  const { tokens } = useListTokens()
  const { balances, routerAllowances } = useWalletBalance()

  return <Modal
    setVisible={setVisible}
    visible={visible}
    title='Select token'
  >
    <div className='select-token-modal'>
      {
        tokensToSelect.map((address: any, key: number) => {
          let fee: string | any = ''
          let symbol = <TokenSymbol token={tokens[address]} />
          if (displayFee) {
            if (address === cToken) {
              fee = <TextBuy>(+{fee10000 / 20000 * 100}% fee)</TextBuy>
            } else if (address === baseToken || address === quoteToken) {
              fee = <TextSell>(-{fee10000 / 20000 * 100}% fee)</TextSell>
              const remainToken = address === baseToken ? quoteToken : baseToken

              if (balances[remainToken].gt(0) && routerAllowances[remainToken].gt(0)) {
                symbol = <Fragment>
                  {symbol} + <TokenSymbol token={tokens[remainToken]} />
                </Fragment>
              }
            }
          }
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
