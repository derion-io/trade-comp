import { Text, TextBuy, TextGrey, TextSell } from '../../ui/Text'
import { div, formatFloat, sub, zerofy } from '../../../utils/helpers'
import { Box } from '../../ui/Box'
import React from 'react'
import { InfoRow } from '../../ui/InfoRow'
import { useListTokens } from '../../../state/token/hook'
import { Position } from '../../../utils/type'
import { NetValue, LinearPnL, VALUE_IN_USD_STATUS, CompoundToLinearPnL, Funding, PnL } from '../../Positions'
import { useHelper } from '../../../state/config/useHelper'
const mdp = require('move-decimal-point')

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
  const { entryPrice, currentPrice } = position
  const priceRate = div(sub(currentPrice, entryPrice), entryPrice)
  const rateDisplay = priceRate > 0
    ? <TextBuy>(+{formatFloat(mdp(priceRate, 2), undefined, 3, true)}%)</TextBuy>
    : <TextSell>({formatFloat(mdp(priceRate, 2), undefined, 3, true)}%)</TextSell>

    return (
    <Box borderColor='default' className='swap-info-box mt-1 mb-1'>
      <InfoRow>
        <TextGrey>
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
        </TextGrey>
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
      {!entryPrice || (
        <InfoRow>
          <TextGrey>Entry Price</TextGrey>
          <TextGrey>{zerofy(formatFloat(entryPrice))}</TextGrey>
        </InfoRow>
      )}
      {!currentPrice || (
        <InfoRow>
          <TextGrey>Exit Price</TextGrey>
          <Text>{rateDisplay} {zerofy(formatFloat(currentPrice))}</Text>
        </InfoRow>
      )}
    </Box>
  )
}
