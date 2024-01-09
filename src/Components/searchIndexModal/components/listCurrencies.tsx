import moment from 'moment'
import React, { useEffect } from 'react'
import { PoolGroupValueType } from '../../../state/resources/type'
import { useListTokens } from '../../../state/token/hook'
import { useWalletBalance } from '../../../state/wallet/hooks/useBalances'
import { MIN_POSITON_VALUE_USD_TO_DISPLAY } from '../../../utils/constant'
import formatLocalisedCompactNumber from '../../../utils/formatBalance'
import { bn, formatFloat, unwrap, zerofy } from '../../../utils/helpers'
import { PoolSearch } from '../../../utils/type'
import { CurrencyGroupLogo } from '../../ui/CurrencyGroupLogo'
import { SkeletonLoader } from '../../ui/SkeletonLoader'
import { Text, TextGrey, TextPink } from '../../ui/Text'
import { TokenIcon } from '../../ui/TokenIcon'
import './index.scss'
type Props = {
  poolsFilterSearch: PoolSearch[],
  poolGroupsValue?: PoolGroupValueType
  handlePoolSelect: (pool: PoolSearch, hasWarning?: boolean) => void
  isLoading: boolean
}
export const ListCurrencies = ({ poolsFilterSearch, poolGroupsValue, isLoading = false, handlePoolSelect }: Props) => {
  const { tokens } = useListTokens()
  const { balances } = useWalletBalance()
  useEffect(() => {
    console.log('#poolGroupsValue', poolGroupsValue)
    console.log('#poolsFilterSearch', poolsFilterSearch)
  }, [poolGroupsValue, poolsFilterSearch])
  return (
    <div className='token-list'>
      <div>
        {poolsFilterSearch.map((index, _) => {
          return index.pools.map((pool, __) => {
            return (
              <div key={_ + __} className='position-token-list'>
                <div
                  className='position-token-list__table'
                  onClick={() => handlePoolSelect({
                    baseToken: index.baseToken,
                    quoteToken: index.baseToken,
                    pools: [pool]
                  })}
                >
                  <div className='token-item'>
                    <span className='chart-token-selector--current inline-items-center'>
                      <CurrencyGroupLogo currencyURIs={[index.baseToken.logoURI, index.quoteToken.logoURI]} size={36}/>
                      <div className='chart-token-symbol'>
                        <Text>
                          {unwrap(index.baseToken.symbol)}/{unwrap(index.quoteToken.symbol)}
                        </Text><br/>
                        <div className='pool-positions-list__wrap'>
                          {/* <TextGrey>Positions</TextGrey> */}
                          <div className='pool-positions-list'>
                            {pool.poolPositions?.length !== 0 ? pool.poolPositions.map((playingToken:any) => {
                              const { address, value } = playingToken
                              if (value < MIN_POSITON_VALUE_USD_TO_DISPLAY) return null
                              if (balances[address] && bn(balances[address]).gt(0)) {
                                return <TokenIcon key={address} size={20} tokenAddress={address} />
                              } else {
                                return null
                              }
                            })
                              : <TextGrey>  {pool?.timeStamp ? moment
                                .unix(pool?.timeStamp)
                                .fromNow()
                                .toLocaleLowerCase() : ''} </TextGrey>}
                          </div>
                        </div>

                      </div>

                    </span>
                    <span className='inline-items-center' />
                  </div>

                  <div className='index-value-item'>
                    {pool?.poolValueR > 0
                      ? <div style={{ margin: 0 }}>
                        <TextPink> {`${unwrap(tokens[pool?.TOKEN_R].symbol)}`}</TextPink>
                        <Text>{`${zerofy(pool?.poolValueR)}`}</Text>
                      </div>
                      : <SkeletonLoader textLoading='   ' loading/>}

                    {pool?.poolValue > 0
                      ? <TextGrey>{`$${formatLocalisedCompactNumber(formatFloat(pool?.poolValue))}` }</TextGrey>
                      : <SkeletonLoader textLoading='   ' loading/>}
                  </div>
                </div>

              </div>
            )
          })
        })}
      </div>
      {isLoading && Array(8).fill(0).map((a, _) => <SkeletonLoader height='50px' key={_} loading style={{ width: '100%', marginTop: '1rem' }}/>)}
      <div className='search-model-footer'><TextGrey>Enter to search more</TextGrey></div>
    </div>
  )
}
