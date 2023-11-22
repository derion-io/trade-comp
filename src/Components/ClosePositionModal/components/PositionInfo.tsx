import { Text } from '../../ui/Text'
import { formatFloat, zerofy } from '../../../utils/helpers'
import { Box } from '../../ui/Box'
import React from 'react'
import { InfoRow } from '../../ui/InfoRow'
import { useListTokens } from '../../../state/token/hook'
import { Position } from '../../../utils/type'
import { NetValue, Pnl, VALUE_IN_USD_STATUS } from '../../Positions'
import { useHelper } from '../../../state/config/useHelper'

export const PositionInfo = ({
  position,
  valueInUsdStatus,
  setValueInUsdStatus,
  loading
}: {
  position: Position
  valueInUsdStatus: VALUE_IN_USD_STATUS
  setValueInUsdStatus: (value: VALUE_IN_USD_STATUS) => void
  loading?: boolean,
}) => {
  const { wrapToNativeAddress } = useHelper()
  const { tokens } = useListTokens()
  return (
    <Box borderColor='default' className='swap-info-box mt-1 mb-1'>
      <InfoRow>
        <Text>Net Value</Text>
        <NetValue
          valueInUsdStatus={valueInUsdStatus}
          valueU={position.valueU}
          valueR={position.valueR}
          pool={position.pool}
          isPhone
        />
      </InfoRow>
      {!position.entryValueU || (
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
      {position?.currentPrice ? (
        <InfoRow>
          <Text>Exit Price</Text>
          <Text>{zerofy(formatFloat(position.currentPrice))}</Text>
        </InfoRow>
      ) : ''}
    </Box>
  )
}
