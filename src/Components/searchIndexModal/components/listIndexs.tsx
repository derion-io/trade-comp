import moment from 'moment'
import React, { useEffect, useMemo } from 'react'
import { useListTokens } from '../../../state/token/hook'
import { useWalletBalance } from '../../../state/wallet/hooks/useBalances'
import formatLocalisedCompactNumber from '../../../utils/formatBalance'
import { bn, formatFloat, getPoolPower, unwrap, zerofy } from '../../../utils/helpers'
import { PoolSearch } from '../../../utils/type'
import { CurrencyGroupLogo } from '../../ui/CurrencyGroupLogo'
import { SkeletonLoader } from '../../ui/SkeletonLoader'
import { Text, TextGrey, TextPink } from '../../ui/Text'
import { TokenIcon } from '../../ui/TokenIcon'
import './index.scss'
import { useResource } from '../../../state/resources/hooks/useResource'
import { useSettings } from '../../../state/setting/hooks/useSettings'
import { Marker } from './marker'
import { WarningIcon } from '../../ui/Icon'
import { useConfigs } from '../../../state/config/useConfigs'
type Props = {
  poolsFilterSearch: { [key: string]: PoolSearch }
  handlePoolSelect: (pool: PoolSearch, hasWarning?: boolean) => void
  isLoading: boolean
}
export const ListIndexs = ({
  poolsFilterSearch,
  isLoading,
  handlePoolSelect
}: Props) => {
  const { tokens } = useListTokens()
  const { balances } = useWalletBalance()
  const { useCalculatePoolGroupsValue } = useResource()
  const { ddlEngine } = useConfigs()
  const { poolGroupsValue } = useCalculatePoolGroupsValue()
  const indexWhiteList = useMemo(() => {
    return ddlEngine?.profile.whitelistPools
  }, [ddlEngine?.profile])
  const Indexs = useMemo(() => {
    let canSort = true
    Object.keys(poolsFilterSearch).map((key) => {
      if (!poolGroupsValue[key]?.poolGroupValue) {
        canSort = false
      }
    })
    if (canSort) return poolGroupsValue
    else return poolsFilterSearch
  }, [poolGroupsValue, poolsFilterSearch])
  const { settings } = useSettings()
  return (
    <div className='token-list'>
      <div>
        {Object.keys(Indexs).map((key, _) => {
          const index = poolsFilterSearch[key]
          if (!index?.baseToken) return
          const isIndexWhiteListed = index?.pools.map((p) => p?.poolAddress).filter((pAddress) => indexWhiteList?.includes(pAddress)).length > 0
          // return index?.pools.map((pool, __) => {
          return (
            <div key={_} className='position-token-list'>
              <div
                className='position-token-list__table'
                onClick={() => {
                  if (!indexWhiteList) return
                  handlePoolSelect(index, !isIndexWhiteListed)
                }}
              >
                <div className='token-item'>
                  <span className='chart-token-selector--current inline-items-center'>
                    <CurrencyGroupLogo
                      currencyURIs={[
                        index?.baseToken.logoURI,
                        index?.quoteToken.logoURI
                      ]}
                      size={[48, 36]}
                    />
                    <div className='chart-token-symbol'>
                      <Text>
                        <Marker index={index}/>
                        {unwrap(index.baseToken.symbol)}/
                        {unwrap(index.quoteToken.symbol)}

                        <TextGrey>
                          {' '}
                          ({
                            index.pools
                              .map(pool => getPoolPower(pool))
                              .filter((value, index, self) => self.indexOf(value) === index)
                              .slice(0, 3)
                              .map((p, __) => {
                                return p !== 0
                                  ? String(p) + 'x'
                                  : ''
                              })
                          })
                        </TextGrey>
                      </Text>
                      <br />
                      <div className='pool-positions-list__wrap'>
                        {/* <TextGrey>Positions</TextGrey> */}

                        <div className='pool-positions-list'>
                          {isIndexWhiteListed ? '' : <WarningIcon fill='gray'/>}

                          {poolGroupsValue?.[key]?.poolGroupPositions?.length >
                          0 ? (
                            poolGroupsValue[key]?.poolGroupPositions?.map(
                              (playingToken: any) => {
                                const { address, value } = playingToken
                                if (value < settings.minPositionValueUSD) {
                                  return null
                                }
                                if (
                                  balances[address] &&
                                  bn(balances[address]).gt(0)
                                ) {
                                  return (
                                    <TokenIcon
                                      key={address}
                                      size={20}
                                      tokenAddress={address}
                                    />
                                  )
                                } else {
                                  return null
                                }
                              }
                            )
                            ) : (
                              <TextGrey>
                                {' '}
                                {index.pools[Object.keys(index.pools)[0]]
                                  ?.timeStamp
                                  ? moment
                                    .unix(
                                      index.pools[Object.keys(index.pools)[0]]
                                        ?.timeStamp
                                    )
                                    .fromNow()
                                    .toLocaleLowerCase()
                                  : ''}{' '}
                              </TextGrey>
                            )}
                        </div>
                      </div>
                    </div>
                  </span>
                  <span className='inline-items-center' />
                </div>

                <div className='index-value-item'>
                  <div>
                    {poolGroupsValue[key]?.poolGroupValueR > 0 ? (
                      <div style={{ margin: 0 }}>
                        {' '}
                        <Text>{`${zerofy(poolGroupsValue[key]?.poolGroupValueR, {
                        maxZeros: 4,
                        maximumSignificantDigits: 2
                      })}`}</Text>
                        <TextPink>
                          {`${unwrap(
                          tokens[
                            index.pools[Object.keys(index.pools)[0]]?.TOKEN_R
                          ].symbol
                        )}`}
                        </TextPink>
                      </div>
                    ) : (
                      <SkeletonLoader textLoading='   ' loading />
                    )}

                    {poolGroupsValue[key]?.poolGroupValue ? (
                      <TextGrey>{`$${formatLocalisedCompactNumber(
                      formatFloat(poolGroupsValue[key]?.poolGroupValue)
                    )}`}</TextGrey>
                    ) : (
                      ''
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {isLoading &&
        Array(1)
          .fill(0)
          .map((a, _) => (
            <SkeletonLoader
              height='50px'
              key={_}
              loading
              style={{ width: '100%', marginTop: '1rem' }}
            />
          ))}
      <div className='search-model-footer'>
        <TextGrey>Enter to search for more</TextGrey>
      </div>
    </div>
  )
}
