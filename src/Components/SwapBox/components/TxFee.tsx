import { Text, TextGrey } from '../../ui/Text'
import { formatWeiToDisplayNumber } from '../../../utils/formatBalance'
import { numberToWei, weiToNumber } from '../../../utils/helpers'
import { Box } from '../../ui/Box'
import React from 'react'
import { InfoRow } from '../../ui/InfoRow'
import { useNativePrice } from '../../../hooks/useTokenPrice'
import { BigNumber } from 'ethers'
import { useConfigs } from '../../../state/config/useConfigs'

export const TxFee = ({ gasUsed, txFee } : {gasUsed: BigNumber, txFee: BigNumber}) => {
  const { chainId } = useConfigs()
  const { data: nativePrice } = useNativePrice()

  return <Box borderColor='default' className='swap-info-box mt-1 mb-1'>
    <InfoRow>
      <TextGrey>Gas Used</TextGrey>
      <span>
        <Text>{formatWeiToDisplayNumber(gasUsed, 0, 0)}</Text>
      </span>
    </InfoRow>
    <InfoRow>
      <TextGrey>Transaction Fee</TextGrey>
      <span>
        <Text>
          {weiToNumber(gasUsed.mul(0.1 * 10 ** 9), 18, 5)}
          <TextGrey> {chainId === 56 ? 'BNB' : 'ETH'} </TextGrey>
          (${weiToNumber(gasUsed.mul(0.1 * 10 ** 9).mul(numberToWei(nativePrice)), 36, 2)})
        </Text>
      </span>
    </InfoRow>
  </Box>
}
