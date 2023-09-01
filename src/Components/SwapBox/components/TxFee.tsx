import {
  Text,
  TextError,
  TextGreen,
  TextGrey,
  TextWarning
} from '../../ui/Text'
import { formatWeiToDisplayNumber } from '../../../utils/formatBalance'
import { numberToWei, weiToNumber } from '../../../utils/helpers'
import { Box } from '../../ui/Box'
import React, { useEffect, useState } from 'react'
import { InfoRow } from '../../ui/InfoRow'
import { useNativePrice } from '../../../hooks/useTokenPrice'
import { BigNumber } from 'ethers'
import { useConfigs } from '../../../state/config/useConfigs'
import { SkeletonLoader } from '../../ui/SkeletonLoader'
import { useFeeData } from '../../../state/resources/hooks/useFeeData'

export const TxFee = ({
  gasUsed,
  payoffRate,
  loading
}: {
  gasUsed: BigNumber
  payoffRate?: number
  loading?: boolean
}) => {
  const { chainId } = useConfigs()
  const { data: nativePrice } = useNativePrice()
  const [gasPrice, setGasPrice] = useState<any>(BigNumber.from(10 ** 8))
  const { feeData } = useFeeData()
  useEffect(() => {
    setGasPrice(feeData.gasPrice)
  }, [feeData])

  return (
    <Box borderColor='default' className='swap-info-box mt-1 mb-1'>
      <InfoRow>
        <TextGrey>Return Rate</TextGrey>
        <SkeletonLoader loading={!!loading}>
          <span>
            {payoffRate == null ? (
              <TextGreen>&nbsp;</TextGreen>
            ) : payoffRate > 100 ? (
              <TextGreen>100%</TextGreen>
            ) : payoffRate >= 97 ? (
              <TextGreen>{payoffRate}%</TextGreen>
            ) : payoffRate >= 94 ? (
              <TextWarning>{payoffRate}%</TextWarning>
            ) : (
              <TextError>{payoffRate}%</TextError>
            )}
          </span>
        </SkeletonLoader>
      </InfoRow>
      <InfoRow>
        <TextGrey>Estimated Gas</TextGrey>
        <SkeletonLoader loading={!!loading}>
          {!gasUsed || gasUsed?.isZero() ? (
            <Text>&nbsp;</Text>
          ) : (
            <Text>{formatWeiToDisplayNumber(gasUsed, 0, 0)}</Text>
          )}
        </SkeletonLoader>
      </InfoRow>
      <InfoRow>
        <TextGrey>Estimated Fee</TextGrey>
        <SkeletonLoader loading={!!loading}>
          {!nativePrice || !gasUsed || gasUsed?.isZero() ? (
            <Text>&nbsp;</Text>
          ) : (
            <Text>
              {weiToNumber(gasUsed.mul(gasPrice), 18, 5)}
              <TextGrey> {chainId === 56 ? 'BNB' : 'ETH'} </TextGrey>
              ($
              {weiToNumber(
                gasUsed.mul(gasPrice).mul(numberToWei(nativePrice)),
                36,
                2
              )}
              )
            </Text>
          )}
        </SkeletonLoader>
      </InfoRow>
    </Box>
  )
}
