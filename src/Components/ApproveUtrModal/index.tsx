import React, { useState } from 'react'
import { Modal } from '../ui/Modal'
import './style.scss'
import isEqual from 'react-fast-compare'
import { ButtonExecute } from '../ui/Button'
import { useConfigs } from '../../state/config/useConfigs'
import { useWalletBalance } from '../../state/wallet/hooks/useBalances'
import { toast } from 'react-toastify'
import { useListTokens } from '../../state/token/hook'

const Component = ({
  visible,
  setVisible,
  inputTokenAddress,
  callBack
}: {
  visible: boolean
  inputTokenAddress: string
  setVisible: any
  callBack?: any
}) => {
  const { approveRouter } = useWalletBalance()
  const { configs } = useConfigs()
  const [loading, setLoading] = useState<boolean>(false)
  const { tokens } = useListTokens()

  const onApprove = async () => {
    try {
      setLoading(true)
      await approveRouter({ tokenAddress: inputTokenAddress })
      callBack && callBack()
      setLoading(false)
      setVisible(false)
    } catch (e) {
      console.error(e)
      toast.error('Cannot approve, please try again')
    }
  }

  return (
    <Modal
      setVisible={setVisible}
      visible={visible}
      title='Enable EIP-6120'
      width='48rem'
    >
      <div className='approve-utr-modal'>
        <p className='mb-2'>
          The Universal Token Router (EIP-6120) is used by Derivable for token
          routing and allowance. You only need to approve your token to this
          contract once.
        </p>
        <div className='text-center mb-2'>
          <p>The contract code is verified here:</p>
          <a
            href={`${configs.explorer}/address/${configs.addresses.router}#code`}
            target='_blank'
            rel='noreferrer'
          >
            {configs.addresses.router}
          </a>
          .
        </div>
        <div className='text-center mb-2'>
          <p>EIP-6120 is open for public review at the following link:</p>
          <a
            href='https://eips.ethereum.org/EIPS/eip-6120'
            target='_blank'
            rel='noreferrer'
          >
            https://eips.ethereum.org/EIPS/eip-6120.
          </a>
        </div>
        <div className='text-center'>
          {loading ? (
            <ButtonExecute disabled>Requesting Wallet...</ButtonExecute>
          ) : (
            <ButtonExecute onClick={onApprove}>
              Approve {tokens[inputTokenAddress]?.symbol} to EIP-6120
            </ButtonExecute>
          )}
        </div>
      </div>
    </Modal>
  )
}

export const ApproveUtrModal = React.memo(Component, (prevProps, nextProps) =>
  isEqual(prevProps, nextProps)
)
