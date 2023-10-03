import { Text } from '../../ui/Text'
import { formatFloat, zerofy } from '../../../utils/helpers'
import { Box } from '../../ui/Box'
import React from 'react'
import { InfoRow } from '../../ui/InfoRow'
import { useListTokens } from '../../../state/token/hook'
import { Position } from '../../../utils/type'
import { NetValue, Pnl, VALUE_IN_USD_STATUS } from '../../Positions'
import { useHelper } from '../../../state/config/useHelper'
import { useSettings } from '../../../state/setting/hooks/useSettings'
import { SkeletonLoader } from '../../ui/SkeletonLoader'

export const PositionInfo = ({
  position,
  valueInUsdStatus,
  setValueInUsdStatus,
  loading,
  valueOut,
  amountOut
}: {
  position: Position
  valueInUsdStatus: VALUE_IN_USD_STATUS
  setValueInUsdStatus: (value: VALUE_IN_USD_STATUS) => void
  valueOut?: string,
  amountOut?: string,
  loading?: boolean,
}) => {
  const { wrapToNativeAddress } = useHelper()
  const { tokens } = useListTokens()
  const { settings } = useSettings()
  return (
    <Box borderColor='default' className='swap-info-box mt-1 mb-1'>
      <InfoRow>
        <Text>Net Value</Text>
        <NetValue
          valueInUsdStatus={valueInUsdStatus}
          valueUsd={position.valueUsd}
          value={position.value}
          pool={position.pool}
          isPhone
        />
      </InfoRow>
      {!position.entryValue || (
        <InfoRow>
          <Text>
            PnL
            <Text
              className='text-link'
              onClick={() => {
                setValueInUsdStatus(
                  valueInUsdStatus === VALUE_IN_USD_STATUS.USD
                    ? VALUE_IN_USD_STATUS.TOKEN_R
                    : VALUE_IN_USD_STATUS.USD
                )
              }}
            >
              {valueInUsdStatus === VALUE_IN_USD_STATUS.USD
                ? ` ⇄ ${
                    tokens[wrapToNativeAddress(position.pool.TOKEN_R)]?.symbol
                  }`
                : ' ⇄ USD'}
            </Text>
          </Text>
          <Pnl
            valueInUsdStatus={valueInUsdStatus}
            position={position}
            isPhone
          />
        </InfoRow>
      )}
      {!position.entryPrice || (
        <InfoRow>
          <Text>Entry Price</Text>
          <Text>{zerofy(formatFloat(position.entryPrice))}</Text>
        </InfoRow>
      )}
      {!settings.slippageTolerance || (
        <InfoRow>
          <Text>Slippage Tolerance</Text>
          <Text>{settings.slippageTolerance}%</Text>
        </InfoRow>
      )}
      {(settings.slippageTolerance && String(valueOut) !== '0') ? (

        <InfoRow>
          <Text>Minimum Value Receive</Text>
          <SkeletonLoader loading={!!loading}>
            <NetValue
              valueInUsdStatus={valueInUsdStatus}
              valueUsd={String(Number(valueOut) * (1 - settings.slippageTolerance)) || '0'}
              value={String(Number(amountOut) * (1 - settings.slippageTolerance)) || '0'}
              pool={position.pool}
              isPhone
            />
          </SkeletonLoader>
        </InfoRow>

      ) : ''}
    </Box>
  )
}
