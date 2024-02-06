import { BigNumber, Contract } from 'ethers'
import { useConfigs } from '../../state/config/useConfigs'
import { useResource } from '../../state/resources/hooks/useResource'
import DerivablePosition from './DerivablePosition.json'
import { useWeb3React } from '../../state/customWeb3React/hook'
import { IEW, WEI, bn, encodeErc1155Address, formatFloat, packId } from '../../utils/helpers'
import { POOL_IDS } from '../../utils/constant'
import { useWalletBalance } from '../../state/wallet/hooks/useBalances'
import { Button, ButtonClose } from '../ui/Button'
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
interface IProps {
  visible: boolean,
  setVisible: (a: boolean) => void,
  title?: string
}
export const BatchTransferModal = ({
  visible,
  setVisible,
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

  const paramBatchTransfer = useMemo(() => {
    if (!configs?.derivable?.token || Object.keys(pools).length === 0) return []
    if (!isAddress(recipient)) {
      setErrorMessage('Invalid address')
      return []
    }
    const positions: {
      id: BigNumber,
      amount: BigNumber
    }[] = []
    Object.keys(pools).forEach((pool) => {
      [POOL_IDS.A, POOL_IDS.B, POOL_IDS.C].map((side, _) => {
        if (balances[encodeErc1155Address(pool, side)]?.gt(0)) {
          positions.push(
            {
              id: packId(String(side), pool),
              amount: balances[encodeErc1155Address(pool, side)]
            })
        }
      })
    })
    const paramBatchTransfer = [
      account,
      recipient,
      positions.map(pos => pos.id),
      positions.map(pos => pos.amount),
      [],
    ]
    const erc1155 = new Contract(configs.derivable.token, DerivablePosition, provider?.getSigner() || provider)
    setLoading(true)
    console.log('#positionIds', paramBatchTransfer)

    erc1155.estimateGas.safeBatchTransferFrom(...paramBatchTransfer).then(res => {
      setGasEstimate(res)
    })
    erc1155.callStatic.safeBatchTransferFrom(...paramBatchTransfer).then(res => {
      setErrorMessage(undefined)
      setLoading(false)
    }).catch(err => {
      console.log(err)
      setErrorMessage(err?.reason ?? err?.error ?? err?.data?.message ?? 'Transaction Failed')
      setLoading(false)
    })
    return paramBatchTransfer
  }, [pools, balances, account, recipient, configs, provider])

  const onBatchTransfer = async () => {
    if (!recipient && !isAddress(recipient) && !errorMessage && paramBatchTransfer?.length === 0 && !paramBatchTransfer) return
    const erc1155 = new Contract(configs.derivable.token, DerivablePosition, provider?.getSigner() || provider)

    try {
      setLoading(true)
      const tx = await erc1155.safeBatchTransferFrom(...paramBatchTransfer)
      toast.success('Transaction Submitted')
      await tx.wait()
      toast.success('Transaction Confirmed')
      setLoading(false)
    } catch (err) {
      setLoading(false)
      toast.error(err?.reason ?? err?.error ?? err?.data?.message ?? 'Transaction Failed')
      console.log(err)
    }
    console.log('#positionIds', paramBatchTransfer, account)
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
