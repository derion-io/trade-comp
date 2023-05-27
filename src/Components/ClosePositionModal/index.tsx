import React, { useMemo } from 'react'
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
import { decodeErc1155Address, div, isErc1155Address, weiToNumber } from '../../utils/helpers'
import { POOL_IDS } from '../../utils/constant'

const Component = ({
  visible,
  setVisible,
  dToken
}: {
  visible: boolean,
  setVisible: any,
  dToken: string
}) => {
  const { tokens } = useListTokens()

  return <Modal
    setVisible={setVisible}
    visible={visible}
    title='Close position'
  >
    <div className='close-position-modal' />
  </Modal>
}

export const ClosePosition = React.memo(Component, (prevProps, nextProps) =>
  isEqual(prevProps, nextProps)
)
