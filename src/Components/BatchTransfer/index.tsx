import { BigNumber, Contract } from 'ethers'
import { useConfigs } from '../../state/config/useConfigs'
import { useResource } from '../../state/resources/hooks/useResource'
import DerivablePosition from './DerivablePosition.json'
import { useWeb3React } from '../../state/customWeb3React/hook'
import { IEW, WEI, bn, encodeErc1155Address, formatFloat, packId } from '../../utils/helpers'
import { POOL_IDS } from '../../utils/constant'
import { useWalletBalance } from '../../state/wallet/hooks/useBalances'
import { Button, ButtonBuy } from '../ui/Button'
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
  const [newWallet, setNewWallet] = useState<string>('0xdEc91a05108713067ee6BaB1A999381623E5c0AE')
  const [loading, setLoading] = useState<boolean>(false)
  const [gasUsed, setGasEstimate] = useState<BigNumber>(bn(0))
  const { feeData } = useFeeData()
  const gasPrice: BigNumber = useMemo(() => bn(feeData?.gasPrice ?? 1), [feeData])

  const paramBatchTransfer = useMemo(() => {
    const positionIds: {
      id: BigNumber,
      amount: BigNumber
    }[] = []
    Object.keys(pools).forEach((poolAddress) => {
      [POOL_IDS.A, POOL_IDS.B, POOL_IDS.C].map((pool_id, _) => {
        if (balances[encodeErc1155Address(poolAddress, pool_id)]?.gt(0)) {
          positionIds.push(
            {
              id: packId(String(pool_id), poolAddress),
              amount: balances[encodeErc1155Address(poolAddress, pool_id)]
            })
        }
      })
    })
    const paramBatchTransfer = [account,
      newWallet,
      positionIds.map(positionIds => positionIds.id),
      positionIds.map(positionIds => positionIds.amount),
      0]
    return paramBatchTransfer
  }, [pools, balances])

  const onBatchTransfer = async () => {
    if (!newWallet && !isAddress(newWallet)) return
    const erc1155 = new Contract(configs.derivable.token, DerivablePosition, provider?.getSigner() || provider)

    try {
      await erc1155.callStatic.safeBatchTransferFrom(...paramBatchTransfer)
      setLoading(true)
      const tx = await erc1155.safeBatchTransferFrom(...paramBatchTransfer)
      toast.success('Transaction Submitted')
      await tx.wait()
      toast.success('Transaction Confirmed')
      setLoading(false)
    } catch (e) {
      setLoading(false)
      toast.error(e?.reason ?? e?.message ?? 'Transaction Failed')
      console.error(e)
    }
    console.log('#positionIds', paramBatchTransfer, account)
  }

  return (
    <Modal
      setVisible={setVisible}
      visible={visible}
      title={title || 'Batch transfers'}
    >
      <div className='mb-05'>
        <Text>Batch Transfer</Text>
      </div>
      <div className='mb-05'>
        <Input value={newWallet} onChange={(e) => {
          setNewWallet(e.target.value || '')
        }} onBlur={() => {
          const erc1155 = new Contract(configs.derivable.token, DerivablePosition, provider?.getSigner() || provider)
          erc1155.estimateGas.safeBatchTransferFrom(...paramBatchTransfer).then(res => {
            setGasEstimate(res)
          })
        }}/>
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
        <ButtonBuy style={{ width: '100%' }} disabled={loading || !isAddress(newWallet)} onClick={onBatchTransfer}>
          {loading ? 'Pending...' : 'Batch Transfer'}</ButtonBuy>
      </div>
    </Modal>

  )
}
