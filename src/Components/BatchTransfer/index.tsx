import { BigNumber, Contract } from 'ethers'
import { useConfigs } from '../../state/config/useConfigs'
import { useResource } from '../../state/resources/hooks/useResource'
import DerivablePosition from './DerivablePosition.json'
import { useWeb3React } from '../../state/customWeb3React/hook'
import { encodeErc1155Address, packId } from '../../utils/helpers'
import { POOL_IDS } from '../../utils/constant'
import { useWalletBalance } from '../../state/wallet/hooks/useBalances'
import { Button } from '../ui/Button'
import React, { useState } from 'react'
import { Input } from '../ui/Input'
import { toast } from 'react-toastify'

import { isAddress } from '../../utils/filtering'
import { Text } from '../ui/Text'
export const BatchTransfer = () => {
  const { configs } = useConfigs()
  const { pools } = useResource()
  const { provider, account } = useWeb3React()
  const { balances } = useWalletBalance()
  const [newWallet, setNewWallet] = useState<string>('0xdEc91a05108713067ee6BaB1A999381623E5c0AE')
  const [loading, setLoading] = useState<boolean>(false)
  const onBatchTransfer = async () => {
    if (!newWallet && !isAddress(newWallet)) return
    const erc1155 = new Contract(configs.derivable.token, DerivablePosition, provider?.getSigner() || provider)
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

    try {
      await erc1155.callStatic.safeBatchTransferFrom(
        account,
        newWallet,
        positionIds.map(positionIds => positionIds.id),
        positionIds.map(positionIds => positionIds.amount),
        0)
      setLoading(true)
      const tx = await erc1155.safeBatchTransferFrom(
        account,
        newWallet,
        positionIds.map(positionIds => positionIds.id),
        positionIds.map(positionIds => positionIds.amount),
        0)
      toast.success('Transaction Submitted')
      await tx.wait()
      toast.success('Transaction Confirmed')
      setLoading(false)
    } catch (e) {
      setLoading(false)
      toast.error(e?.reason ?? e?.message ?? 'Transaction Failed')
      console.error(e)
    }
    console.log('#positionIds', positionIds, account)
  }

  return (
    <div className='mb-1'>
      <div className='mb-05'>
        <Text>Batch Transfer</Text>
      </div>
      <div className='mb-05'>
        <Input value={newWallet} onChange={(e) => {
          setNewWallet(e.target.value || '')
        }} />
      </div>
      <div className='mb-05'>
        <Button disabled={!isAddress(newWallet)} onClick={onBatchTransfer}>Batch Transfer</Button>

      </div>

    </div>

  )
}
