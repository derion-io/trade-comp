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
import { NetValue, VALUE_IN_USD_STATUS } from '../../Positions'

export const TxFee = ({
  position,
  gasUsed,
  payoffRate,
  loading,
  isMaxBalance,
  amountIn,
  valueIn,
  valueInUsdStatus
}: {
  position?: Position
  gasUsed: BigNumber
  payoffRate?: number
  loading?: boolean
  amountIn?:string
  valueIn?:string
  valueInUsdStatus?: VALUE_IN_USD_STATUS
  isMaxBalance?: boolean
  // isCloseModal?:
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
  // formatLocalisedCompactNumber(formatFloat(valueUsd))
  return (
    <Box borderColor='default' className='swap-info-box mt-1 mb-1'>
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
      {!settings.slippageTolerance || (
        <InfoRow>
          <TextGrey>Max Slippage</TextGrey>
          <Text>{settings.slippageTolerance * 100}%</Text>
        </InfoRow>
      )}
      {(settings.slippageTolerance && String(valueIn) !== '0' && valueInUsdStatus) ? (
        <InfoRow>
          <TextGrey>Min Value Received</TextGrey>
          <SkeletonLoader loading={!!loading}>
            <NetValue
              valueInUsdStatus={valueInUsdStatus}
              valueUsd={String(Number(isMaxBalance ? position?.valueUsd : valueIn) * (1 - settings.slippageTolerance)) || '0'}
              value={String(Number(isMaxBalance ? position?.value : amountIn) * (1 - settings.slippageTolerance)) || '0'}
              pool={position?.pool}
              isPhone
            />
          </SkeletonLoader>
        </InfoRow>
      ) : ''}
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

    </Box>
  )
}
