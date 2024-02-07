import { BigNumber, Contract } from 'ethers'
import { useConfigs } from '../../state/config/useConfigs'
import { useResource } from '../../state/resources/hooks/useResource'
import DerivablePosition from './DerivablePosition.json'
import { useWeb3React } from '../../state/customWeb3React/hook'
import { IEW, WEI, bn, encodeErc1155Address, formatFloat, packId, parseCallStaticError } from '../../utils/helpers'
import { useWalletBalance } from '../../state/wallet/hooks/useBalances'
import { ButtonClose } from '../ui/Button'
import React, { useEffect, useMemo, useState } from 'react'
import { Input } from '../ui/Input'
import { toast } from 'react-toastify'

import { isAddress } from '../../utils/filtering'
import { Text, TextGrey } from '../ui/Text'
import { Modal } from '../ui/Modal'
import { InfoRow } from '../ui/InfoRow'
import { SkeletonLoader } from '../ui/SkeletonLoader'
import { useNativePrice } from '../../hooks/useTokenPrice'
import { useFeeData } from '../../state/resources/hooks/useFeeData'
import { formatWeiToDisplayNumber } from '../../utils/formatBalance'
import Tooltip from '../Tooltip/Tooltip'
import { Box } from '../ui/Box'
import { Position } from '../../utils/type'
interface IProps {
  visible: boolean
  setVisible: (a: boolean) => void
  selections: { [key: string]: Position }
  title?: string
}
export const BatchTransferModal = ({
  visible,
  setVisible,
  selections,
  title
}: IProps) => {
  const { configs } = useConfigs()
  const { pools } = useResource()
  const { data: nativePrice } = useNativePrice()
  const { provider, account } = useWeb3React()
  const { balances } = useWalletBalance()
  const [recipient, setRecipient] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string | undefined>()
  const [loading, setLoading] = useState<boolean>(false)
  const [gasUsed, setGasEstimate] = useState<BigNumber>(bn(0))
  const { feeData } = useFeeData()
  const gasPrice: BigNumber = useMemo(() => bn(feeData?.gasPrice ?? 1), [feeData])

  const positions = useMemo(() => {
    return Object.values(selections).map(({poolAddress, side}) => {
      const id = packId(bn(side), poolAddress)
      const amount = balances[encodeErc1155Address(poolAddress, side)]
      return { id, amount }
    }).filter(({ amount }) => amount?.gt(0))
  }, [selections, balances])

  const params = useMemo(() => {
    if (!configs?.derivable?.token || Object.keys(positions).length === 0) return []
    if (!isAddress(recipient)) {
      setErrorMessage('Invalid Address')
      return []
    }
    if (recipient == account) {
      setErrorMessage('Recipient is Sender')
      return []
    }
    return [
      account,
      recipient,
      positions.map(pos => pos.id),
      positions.map(pos => pos.amount),
      [],
    ]
  }, [configs, positions, recipient, account])

  useEffect(() => {
    if (!(params?.length > 0)) {
      return
    }
    const erc1155 = new Contract(configs.derivable.token, DerivablePosition, provider?.getSigner() || provider)
    setLoading(true)
    console.log('#positionIds', params)

    erc1155.estimateGas.safeBatchTransferFrom(...params)
      .then(gas => {
        setErrorMessage(undefined)
        setGasEstimate(gas)
      })
      .catch(err => {
        console.error(err)
        setErrorMessage(String(parseCallStaticError(err)))
      })
      .finally(() => {
        setLoading(false)
      })
  }, [configs, provider, params])

  const onBatchTransfer = async () => {
    if (!recipient && !isAddress(recipient) && !errorMessage && params?.length === 0 && !params) return
    const erc1155 = new Contract(configs.derivable.token, DerivablePosition, provider?.getSigner() || provider)

    try {
      setLoading(true)
      const tx = await erc1155.safeBatchTransferFrom(...params)
      toast.success('Transaction Submitted')
      await tx.wait()
      toast.success('Transaction Confirmed')
      setLoading(false)
    } catch (err) {
      setLoading(false)
      toast.error(err?.reason ?? err?.error ?? err?.data?.message ?? 'Transaction Failed')
      console.log(err)
    }
    console.log('#positionIds', params, account)
  }

  return (
    <Modal
      setVisible={setVisible}
      visible={visible}
      title={title || 'Transfer all positions'}
    >
      <div className='mb-05'>
        <Text>Recipient</Text>
      </div>
      <div className='mb-05'>
        <Input
          value={recipient}
          placeholder='0x'
          onChange={(e) => {
            setRecipient(e.target.value || '')
          }}
        />
      </div>
      <Box borderColor='default' className='swap-info-box mt-1 mb-1'>
        <InfoRow>
          <TextGrey>Network Fee</TextGrey>
          <SkeletonLoader loading={!!loading}>
            {!gasUsed || gasUsed?.isZero() ? (
              <Text>&nbsp;</Text>
            ) : (
              <Tooltip
                position='right-bottom'
                handle={
                  <div>
                    {!nativePrice ||
                  !gasPrice ||
                  !gasUsed ||
                  gasUsed?.isZero() ? (
                        <Text>&nbsp;</Text>
                      ) : (
                        <Text>
                          {IEW(gasUsed.mul(gasPrice), 18, 5)}
                          <TextGrey> {configs.nativeSymbol ?? 'ETH'} </TextGrey>
                      ($
                          {IEW(gasUsed.mul(gasPrice).mul(WEI(nativePrice)), 36, 2)})
                        </Text>
                      )}
                  </div>
                }
                renderContent={() => (
                  <div>
                    <div>
                      <TextGrey>Estimated Gas:&nbsp;</TextGrey>
                      <Text>{formatWeiToDisplayNumber(gasUsed, 0, 0)}</Text>
                    </div>
                    <div>
                      <TextGrey>Gas Price:&nbsp;</TextGrey>
                      <Text>
                        {(gasPrice).gte(1e6)
                          ? formatWeiToDisplayNumber(gasPrice.div(1e9), 0, 0) +
                          ' gwei'
                          : formatWeiToDisplayNumber(gasPrice, 0, 0) + ' wei'}
                      </Text>
                    </div>
                    <div>
                      <TextGrey>{configs.nativeSymbol} Price:&nbsp;</TextGrey>
                      <Text>
                      ${formatFloat(nativePrice || configs.nativePriceUSD, undefined, 4, true)}
                      </Text>
                    </div>
                  </div>
                )}
              />
            )}
          </SkeletonLoader>
        </InfoRow>
      </Box>
      <div className='mb-05'>
        <ButtonClose style={{ width: '100%' }} disabled={errorMessage !== undefined || loading || !isAddress(recipient)} onClick={onBatchTransfer}>
          {loading ? 'Calculating...'
            : errorMessage || 'Transfer'}</ButtonClose>
      </div>
    </Modal>

  )
}
