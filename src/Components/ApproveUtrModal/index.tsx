import React, { useState } from 'react'
import { Modal } from '../ui/Modal'
import './style.scss'
import isEqual from 'react-fast-compare'
import { ButtonExecute } from '../ui/Button'
import { TextBlue } from '../ui/Text'
import { useConfigs } from '../../state/config/useConfigs'
import { useWalletBalance } from '../../state/wallet/hooks/useBalances'
import { toast } from 'react-toastify'

const Component = ({
  visible,
  setVisible,
  inputTokenAddress,
  callBack
}: {
  visible: boolean,
  inputTokenAddress: string
  setVisible: any,
  callBack?: any,
}) => {
  const { approveRouter } = useWalletBalance()
  const { configs } = useConfigs()
  const [loading, setLoading] = useState<boolean>(false)

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

  return <Modal
    setVisible={setVisible}
    visible={visible}
    title='Use EIP-6120'
  >
    <div className='approve-utr-modal'>
      <p className='mb-2'>
        Derivable use the Universal Token Router (EIP-6120) for token routing and allowance.
        You only need to approve your token to this contract once. You can review the verified
        contract here: <TextBlue>{configs.addresses.router}</TextBlue>
      </p>
      <div className='text-center mb-2'>
        <span>EIP-6120 is publicly accessible from here: </span>
        <a href='https://eips.ethereum.org/EIPS/eip-6120' target='_blank' rel='noreferrer'>https://eips.ethereum.org/EIPS/eip-6120.</a>
      </div>
      <div className='text-center'>
        {
          loading
            ? <ButtonExecute disabled>Loading...</ButtonExecute>
            : <ButtonExecute
              onClick={onApprove}
            >Approve BUSD to EIP-6120</ButtonExecute>
        }
      </div>
    </div>
  </Modal>
}

export const ApproveUtrModal = React.memo(Component, (prevProps, nextProps) =>
  isEqual(prevProps, nextProps)
)
