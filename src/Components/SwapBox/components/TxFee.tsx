import {
  Text,
  TextError,
  TextGrey,
  TextWarning
} from '../../ui/Text'
import { formatWeiToDisplayNumber } from '../../../utils/formatBalance'
import { WEI, IEW } from '../../../utils/helpers'
import { Box } from '../../ui/Box'
import React, { useEffect, useState } from 'react'
import { InfoRow } from '../../ui/InfoRow'
import { useNativePrice } from '../../../hooks/useTokenPrice'
import { BigNumber } from 'ethers'
import { useConfigs } from '../../../state/config/useConfigs'
import { SkeletonLoader } from '../../ui/SkeletonLoader'
import { useFeeData } from '../../../state/resources/hooks/useFeeData'
import { Position } from '../../../utils/type'
import { formatPercent } from 'derivable-tools/dist/utils/helper'

export const TxFee = ({
  position,
  gasUsed,
  payoffRate,
  loading,
}: {
  position?: Position
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

  const closingFee = position?.closingFee() ?? { fee: 0 }

  let slippage = 0
  if (payoffRate != null) {
    if (closingFee.fee) {
      payoffRate = payoffRate / (1-closingFee.fee)
    }
    // TODO: handle opening fee here
    slippage = 1 - payoffRate/100
  }

  const feeFormat = formatPercent(closingFee.fee ?? 0, 2)
  const slippageFormat = formatPercent(slippage, 2)

  return (
    <Box borderColor='default' className='swap-info-box mt-1 mb-1'>
      {feeFormat == '0' ? '' :
        <InfoRow>
          <TextGrey>Closing Fee</TextGrey>
          <span>
            {closingFee.isVesting
              ? <TextError>{feeFormat}%</TextError>
              : <TextWarning>{feeFormat}%</TextWarning>
            }
          </span>
        </InfoRow>
      }
      {slippageFormat == '0' ? '' :
        <InfoRow>
          <TextGrey>Slippage</TextGrey>
          <SkeletonLoader loading={!!loading}>
            <span>
              {slippage > 0.01
                ? <TextError>{slippageFormat}%</TextError>
                : <TextWarning>{slippageFormat}%</TextWarning>
              }
            </span>
          </SkeletonLoader>
        </InfoRow>
      }
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
              {IEW(gasUsed.mul(gasPrice), 18, 5)}
              <TextGrey> {chainId === 56 ? 'BNB' : 'ETH'} </TextGrey>
              ($
              {IEW(gasUsed.mul(gasPrice).mul(WEI(nativePrice)), 36, 2)})
            </Text>
          )}
        </SkeletonLoader>
      </InfoRow>
    </Box>
  )
}
