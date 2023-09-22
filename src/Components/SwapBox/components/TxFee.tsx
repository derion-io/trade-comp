import { Text, TextGrey, TextSell, TextWarning } from '../../ui/Text'
import { formatWeiToDisplayNumber } from '../../../utils/formatBalance'
import { WEI, IEW, formatPercent } from '../../../utils/helpers'
import { Box } from '../../ui/Box'
import React, { useEffect, useState } from 'react'
import { InfoRow } from '../../ui/InfoRow'
import { useNativePrice } from '../../../hooks/useTokenPrice'
import { BigNumber } from 'ethers'
import { useConfigs } from '../../../state/config/useConfigs'
import { SkeletonLoader } from '../../ui/SkeletonLoader'
import { useFeeData } from '../../../state/resources/hooks/useFeeData'
import { Position } from '../../../utils/type'
import { useSettings } from '../../../state/setting/hooks/useSettings'
import Tooltip from '../../Tooltip/Tooltip'

export const TxFee = ({
  position,
  gasUsed,
  payoffRate,
  loading
}: {
  position?: Position
  gasUsed: BigNumber
  payoffRate?: number
  loading?: boolean
}) => {
  const { chainId } = useConfigs()
  const { settings } = useSettings()
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
      payoffRate = payoffRate / (1 - closingFee.fee)
    }
    // TODO: handle opening fee here
    slippage = 1 - Math.min(1, payoffRate)
  }

  const feeFormat = formatPercent(closingFee.fee ?? 0, 2, true)
  const slippageFormat = formatPercent(slippage, 2, true)

  return (
    <Box borderColor='default' className='swap-info-box mt-1 mb-1'>
      {feeFormat === 0 ? (
        ''
      ) : (
        <InfoRow>
          <TextGrey>Closing Fee</TextGrey>
          <span>
            {closingFee.isVesting ? (
              <TextSell>{feeFormat}%</TextSell>
            ) : (
              <TextWarning>{feeFormat}%</TextWarning>
            )}
          </span>
        </InfoRow>
      )}
      {slippageFormat === 0 ? (
        ''
      ) : (
        <InfoRow>
          <TextGrey>Slippage</TextGrey>
          <SkeletonLoader loading={!!loading}>
            <span>
              {slippage > settings.slippageTolerance ? (
                <TextSell>{slippageFormat}%</TextSell>
              ) : slippage > settings.slippageTolerance / 2 ? (
                <TextWarning>{slippageFormat}%</TextWarning>
              ) : (
                <Text>{slippageFormat}%</Text>
              )}
            </span>
          </SkeletonLoader>
        </InfoRow>
      )}
      <InfoRow>
        {/* 123 */}
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
                        <TextGrey> {chainId === 56 ? 'BNB' : 'ETH'} </TextGrey>
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
                      {gasPrice.gte(1e6)
                        ? formatWeiToDisplayNumber(gasPrice.div(1e6), 0, 0) +
                          ' gwei'
                        : formatWeiToDisplayNumber(gasPrice, 0, 0) + ' wei'}
                    </Text>
                  </div>
                </div>
              )}
            />
          )}
        </SkeletonLoader>
      </InfoRow>
    </Box>
  )
}
