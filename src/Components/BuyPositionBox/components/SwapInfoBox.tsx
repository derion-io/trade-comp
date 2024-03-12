import React from 'react'
import { useListTokens } from '../../../state/token/hook'
import { TRADE_TYPE } from '../../../utils/constant'
import formatLocalisedCompactNumber from '../../../utils/formatBalance'
import { IEW, formatFloat, formatMaturity, formatPercent, zerofy } from '../../../utils/helpers'
import { useTokenValue } from '../../SwapBox/hooks/useTokenValue'
import Tooltip from '../../Tooltip/Tooltip'
import { Box } from '../../ui/Box'
import { InfoRow } from '../../ui/InfoRow'
import { SkeletonLoader } from '../../ui/SkeletonLoader'
import { Text, TextGrey, TextSell, TextWarning } from '../../ui/Text'
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
          <TextGrey>LP Funding Yield</TextGrey>
          <SkeletonLoader loading={!poolToShow}>
            <Tooltip
              position='right-bottom'
              handle={
                <Text
                  className={fundingRate > 0 ? 'text-green' : ''}
                >
                  {zerofy(formatFloat(fundingRate * 100, undefined, 3, true))}%
                </Text>
              }
              renderContent={() => (
                <div>
                  <div>
                    <TextGrey>LP Interest:&nbsp;</TextGrey>
                    <Text>
                      {zerofy(formatFloat(interest * 100, undefined, 3, true))}%
                    </Text>
                  </div>
                  <div>
                    <TextGrey>LP Premium:&nbsp;</TextGrey>
                    <Text
                      className={premium > 0 ? 'text-green' : ''}
                    >
                      {zerofy(formatFloat(premium * 100, undefined, 2, true))}%
                    </Text>
                  </div>
                  <div>
                    <TextGrey>Trader Interest:&nbsp;</TextGrey>
                    <Text>
                      {zerofy(
                        formatFloat(interestRate * 100, undefined, 2, true)
                      )}
                      %
                    </Text>
                  </div>
                  <div>
                    <TextGrey>Trader Premium Max:&nbsp;</TextGrey>
                    <Text>
                      {zerofy(
                        formatFloat(maxPremiumRate * 100, undefined, 2, true)
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
                      {zerofy(formatFloat(premium * 100, undefined, 2, true))}%
                    </Text>
                  </div>
                  <div>
                    <TextGrey>Max Premium:&nbsp;</TextGrey>
                    <Text>
                      {zerofy(
                        formatFloat(maxPremiumRate * 100, undefined, 2, true)
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

      {poolToShow?.OPEN_RATE?.gt(0) && !poolToShow.OPEN_RATE.eq(Q128) && (
        <InfoRow>
          <TextGrey>Opening Fee</TextGrey>
          <TextWarning>{
            formatPercent(
              Q128.sub(poolToShow.OPEN_RATE).mul(10000).div(Q128).toNumber() / 10000,
              2,
              true,
            )
          }%</TextWarning>
        </InfoRow>
      )}
      {!poolToShow?.MATURITY_VEST?.toNumber() || (
        <InfoRow>
          <TextGrey>Anti-Bot Vesting</TextGrey>
          <SkeletonLoader loading={!poolToShow}>
            {formatMaturity(poolToShow?.MATURITY_VEST)}
          </SkeletonLoader>
        </InfoRow>
      )}
      {!poolToShow?.MATURITY?.toNumber() ||
        !poolToShow?.MATURITY_RATE?.gt(0) || (
        <InfoRow>
          <TextGrey>Anti-Bot Fee</TextGrey>
          <SkeletonLoader loading={!poolToShow}>
            <TextWarning>{
              formatPercent(
                Q128.sub(poolToShow?.MATURITY_RATE)
                  .mul(10000)
                  .div(Q128)
                  .toNumber() / 10000,
                2,
                true
              )
            }%</TextWarning>
            {' for '}
            {poolToShow?.MATURITY.toNumber() < poolToShow?.MATURITY_VEST.toNumber()
              ? <TextSell>{
                formatMaturity(poolToShow?.MATURITY)
              }</TextSell>
              : formatMaturity(poolToShow?.MATURITY)
            }
          </SkeletonLoader>
        </InfoRow>
      )}
    </Box>
  )
}
