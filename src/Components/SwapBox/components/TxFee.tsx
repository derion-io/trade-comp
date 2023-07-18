import { Text, TextError, TextGreen, TextGrey, TextWarning } from '../../ui/Text'
import { formatWeiToDisplayNumber } from '../../../utils/formatBalance'
import { div, formatPercent, numberToWei, weiToNumber } from '../../../utils/helpers'
import { Box } from '../../ui/Box'
import React, { useMemo } from 'react'
import { InfoRow } from '../../ui/InfoRow'
import { useNativePrice } from '../../../hooks/useTokenPrice'
import { BigNumber } from 'ethers'
import { useConfigs } from '../../../state/config/useConfigs'
import { SkeletonLoader } from '../../ui/SkeletonLoader'

export const TxFee = ({
  gasUsed,
  payoffRate,
  loading
}: {
  gasUsed: BigNumber,
  payoffRate?: number,
  loading?: boolean,
}) => {
  const { chainId } = useConfigs()
  const { data: nativePrice } = useNativePrice()

  return <Box borderColor='default' className='swap-info-box mt-1 mb-1'>
    <InfoRow>
      <TextGrey>Payoff Rate</TextGrey>
      <SkeletonLoader loading={payoffRate == null}>
        <span>
          {
            payoffRate == null ? <TextGreen>...</TextGreen> :
            payoffRate > 100 ? <TextGreen>100%</TextGreen> :
            payoffRate >= 97 ? <TextGreen>{payoffRate}%</TextGreen> :
            payoffRate >= 94 ? <TextWarning>{payoffRate}%</TextWarning> :
            <TextError>{payoffRate}%</TextError>
          }
        </span>
      </SkeletonLoader>
    </InfoRow>
    <InfoRow>
      <TextGrey>Estimated Gas</TextGrey>
      <SkeletonLoader loading={!gasUsed || gasUsed?.isZero()}>
        <Text>{formatWeiToDisplayNumber(gasUsed, 0, 0)}</Text>
      </SkeletonLoader>
    </InfoRow>
    <InfoRow>
      <TextGrey>Estimated Fee</TextGrey>
      <SkeletonLoader loading={!nativePrice || !gasUsed || gasUsed?.isZero()}>
        <Text>
          {weiToNumber(gasUsed.mul(0.1 * 10 ** 9), 18, 5)}
          <TextGrey> {chainId === 56 ? 'BNB' : 'ETH'} </TextGrey>
          (${weiToNumber(gasUsed.mul(0.1 * 10 ** 9).mul(numberToWei(nativePrice)), 36, 2)})
        </Text>
      </SkeletonLoader>
    </InfoRow>
  </Box>
}
