import moment from 'moment'
import React, { Fragment } from 'react'
import { useListTokens } from '../../../state/token/hook'
import { TRADE_TYPE } from '../../../utils/constant'
import formatLocalisedCompactNumber from '../../../utils/formatBalance'
import { IEW, formatFloat, formatPercent, zerofy } from '../../../utils/helpers'
import { useTokenValue } from '../../SwapBox/hooks/useTokenValue'
import Tooltip from '../../Tooltip/Tooltip'
import { Box } from '../../ui/Box'
import { InfoRow } from '../../ui/InfoRow'
import { SkeletonLoader } from '../../ui/SkeletonLoader'
import { Text, TextGrey } from '../../ui/Text'
import { BigNumber } from 'ethers'
const Q128 = BigNumber.from(1).shl(128)
type Props = {
  poolToShow: any
  tradeType: TRADE_TYPE
  interest: any
  premium: number
  interestRate: any
  maxPremiumRate: any
  fundingRate: any
  leverageKey: string
  leverageValue: React.JSX.Element | null
}
export const SwapInfoBox = ({
  tradeType,
  poolToShow,
  interest,
  premium,
  interestRate,
  fundingRate,
  maxPremiumRate,
  leverageKey,
  leverageValue
}: Props) => {
  const { tokens } = useListTokens()
  const { value: liquidity } = useTokenValue({
    amount: IEW(poolToShow?.states?.R, tokens[poolToShow?.TOKEN_R]?.decimals),
    tokenAddress: poolToShow?.TOKEN_R
  })
  return (
    <Box borderColor='default' className='swap-info-box mt-1 mb-1 no-wrap'>
      <InfoRow>
        <TextGrey>Liquidity</TextGrey>
        <SkeletonLoader loading={!liquidity || liquidity === '0'}>
          <Text>
            ${formatLocalisedCompactNumber(formatFloat(liquidity, 2))}
          </Text>
        </SkeletonLoader>
      </InfoRow>

      <InfoRow>
        <TextGrey>{leverageKey ?? 'Leverage'}</TextGrey>
        <SkeletonLoader loading={!poolToShow || !leverageValue}>
          {leverageValue}
        </SkeletonLoader>
      </InfoRow>

      {tradeType === TRADE_TYPE.LIQUIDITY ? (
        <InfoRow>
          <TextGrey>Funding Yield</TextGrey>
          <SkeletonLoader loading={!poolToShow}>
            <Tooltip
              position='right-bottom'
              handle={
                <Text
                  className={fundingRate < 0 ? 'text-green' : 'text-warning'}
                >
                  {zerofy(formatFloat(fundingRate * 100, undefined, 3, true))}%
                </Text>
              }
              renderContent={() => (
                <div>
                  <div>
                    <TextGrey>Interest:&nbsp;</TextGrey>
                    <Text>
                      {zerofy(formatFloat(interest * 100, undefined, 3, true))}%
                    </Text>
                  </div>
                  <div>
                    <TextGrey>Premium:&nbsp;</TextGrey>
                    <Text
                      className={premium < 0 ? 'text-green' : 'text-warning'}
                    >
                      {zerofy(formatFloat(premium * 100, undefined, 3, true))}%
                    </Text>
                  </div>
                  <div>
                    <TextGrey>Max Premium:&nbsp;</TextGrey>
                    <Text>
                      {zerofy(
                        formatFloat(maxPremiumRate * 100, undefined, 3, true)
                      )}
                      %
                    </Text>
                  </div>
                </div>
              )}
            />
          </SkeletonLoader>
        </InfoRow>
      ) : (
        <InfoRow>
          <TextGrey>Funding Rate</TextGrey>
          <SkeletonLoader loading={!poolToShow}>
            <Tooltip
              position='right-bottom'
              handle={
                <Text
                  className={fundingRate < 0 ? 'text-green' : 'text-warning'}
                >
                  {zerofy(formatFloat(fundingRate * 100, undefined, 3, true))}%
                </Text>
              }
              renderContent={() => (
                <div>
                  <div>
                    <TextGrey>Interest:&nbsp;</TextGrey>
                    <Text>
                      {zerofy(formatFloat(interest * 100, undefined, 3, true))}%
                    </Text>
                  </div>
                  <div>
                    <TextGrey>Premium:&nbsp;</TextGrey>
                    <Text
                      className={premium < 0 ? 'text-green' : 'text-warning'}
                    >
                      {zerofy(formatFloat(premium * 100, undefined, 3, true))}%
                    </Text>
                  </div>
                  <div>
                    <TextGrey>Max Premium:&nbsp;</TextGrey>
                    <Text>
                      {zerofy(
                        formatFloat(maxPremiumRate * 100, undefined, 3, true)
                      )}
                      %
                    </Text>
                  </div>
                </div>
              )}
            />
          </SkeletonLoader>
        </InfoRow>
      )}

      <hr />

      {tradeType === TRADE_TYPE.LIQUIDITY ? (
        <InfoRow>
          <TextGrey>Interest Rate</TextGrey>
          <SkeletonLoader loading={!poolToShow}>
            {formatFloat(interestRate * 100, undefined, 3, true)}%
          </SkeletonLoader>
        </InfoRow>
      ) : (
        <Fragment />
      )}

      {!poolToShow?.MATURITY_VEST?.toNumber() || (
        <InfoRow>
          <TextGrey>Position Vesting</TextGrey>
          <SkeletonLoader loading={!poolToShow}>
            {moment
              .duration(poolToShow?.MATURITY_VEST.toNumber(), 'seconds')
              .humanize()}
          </SkeletonLoader>
        </InfoRow>
      )}
      {!poolToShow?.MATURITY?.toNumber() ||
        !poolToShow?.MATURITY_RATE?.gt(0) || (
        <InfoRow>
          <TextGrey>Closing Fee</TextGrey>
          <SkeletonLoader loading={!poolToShow}>
            {formatPercent(
              Q128.sub(poolToShow?.MATURITY_RATE)
                .mul(10000)
                .div(Q128)
                .toNumber() / 10000,
              2,
              true
            )}
              % for{' '}
            {moment
              .duration(poolToShow?.MATURITY.toNumber(), 'seconds')
              .humanize()}
          </SkeletonLoader>
        </InfoRow>
      )}
    </Box>
  )
}
