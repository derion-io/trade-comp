import { Text, TextGrey } from '../../ui/Text'
import { formatFloat, zerofy } from '../../../utils/helpers'
import { Box } from '../../ui/Box'
import React from 'react'
import { InfoRow } from '../../ui/InfoRow'
import { useListTokens } from '../../../state/token/hook'
import { Position } from '../../../utils/type'
import { NetValue, LinearPnL, VALUE_IN_USD_STATUS, CompoundToLinearPnL, Funding, PnL } from '../../Positions'
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
        <Text>
          Net Value
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
        <NetValue
          position={position}
          valueInUsdStatus={valueInUsdStatus}
          isPhone
        />
      </InfoRow>
      {!!position.valueRCompound ? <React.Fragment>
        <InfoRow>
          <TextGrey>PnL</TextGrey>
          <LinearPnL
            valueInUsdStatus={valueInUsdStatus}
            position={position}
            isPhone
          />
        </InfoRow>
        <InfoRow>
          <TextGrey>Compound</TextGrey>
          <CompoundToLinearPnL
            valueInUsdStatus={valueInUsdStatus}
            position={position}
            isPhone
          />
        </InfoRow>
        <InfoRow>
          <TextGrey>Funding</TextGrey>
          <Funding
            valueInUsdStatus={valueInUsdStatus}
            position={position}
            isPhone
          />
        </InfoRow>
      </React.Fragment> : <React.Fragment>
        <InfoRow>
          <TextGrey>PnL</TextGrey>
          <PnL
            valueInUsdStatus={valueInUsdStatus}
            position={position}
            isPhone
          />
        </InfoRow>
      </React.Fragment>
      }
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
