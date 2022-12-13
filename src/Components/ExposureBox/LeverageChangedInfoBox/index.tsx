import { useCurrentPool } from '../../../state/currentPool/hooks/useCurrentPool'
import { useListTokens } from '../../../state/token/hook'
import { Text, TextBlue, TextBuy, TextSell } from '../../ui/Text'
import { formatFloat, weiToNumber } from '../../../utils/helpers'
import React from 'react'
import { IconArrowRight } from '../../ui/Icon'

export const LeverageChangedInfoBox = ({
  oldLeverage,
  newLeverage,
  oldValue,
  newValue,
  loading,
  changedIn24h
}: any) => {
  const { quoteToken } = useCurrentPool()
  const { tokens } = useListTokens()
  const OldChangedIn24hText = changedIn24h * oldLeverage < 0 ? TextSell : TextBuy
  const NewChangedIn24hText = changedIn24h * newLeverage < 0 ? TextSell : TextBuy

  return <div className='leverage-changed-box'>
    <div className={`leverage-changed-box__row ${oldLeverage !== newLeverage && 'is-changed'}`}>
      <div>
        <Text>Value </Text>
        <TextBlue>{weiToNumber(oldValue, tokens[quoteToken]?.decimal || 18, 3)} {tokens[quoteToken]?.symbol}</TextBlue>
        <sup> <OldChangedIn24hText fontSize={12}>
          {changedIn24h * oldLeverage >= 0 && '+'}{formatFloat(changedIn24h * oldLeverage, 2)}%
        </OldChangedIn24hText>
        </sup>
      </div>
      {
        (oldLeverage !== newLeverage || (newValue && oldValue && !newValue.eq(oldValue))) &&
        <React.Fragment>
          <span>
            <IconArrowRight />
          </span>
          <div>
            <TextBlue>{weiToNumber(newValue, tokens[quoteToken]?.decimal || 18, 3)} {tokens[quoteToken]?.symbol}</TextBlue>
            <sup> <NewChangedIn24hText fontSize={12}>
              {changedIn24h * newLeverage >= 0 && '+'}{formatFloat(changedIn24h * newLeverage, 2)}%
            </NewChangedIn24hText>
            </sup>
          </div>
        </React.Fragment>
      }
    </div>
  </div>
}
