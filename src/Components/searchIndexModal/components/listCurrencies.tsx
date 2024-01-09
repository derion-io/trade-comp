import moment from 'moment'
import React from 'react'
import { PoolGroupValueType } from '../../../state/resources/type'
import formatLocalisedCompactNumber from '../../../utils/formatBalance'
import { formatFloat, oracleToPoolGroupId } from '../../../utils/helpers'
import { TokenFromPoolGroup } from '../../../utils/type'
import { CurrencyGroupLogo } from '../../ui/CurrencyGroupLogo'
import { SkeletonLoader } from '../../ui/SkeletonLoader'
import { Text, TextGrey } from '../../ui/Text'
import './index.scss'
type Props = {
  whiteListFilterPools: TokenFromPoolGroup[],
  poolGroupsValue: PoolGroupValueType
  handleCurrencySelect: (currency: TokenFromPoolGroup, hasWarning?: boolean) => void
  isLoading: boolean
}
export const ListCurrencies = ({ whiteListFilterPools, poolGroupsValue, isLoading = false, handleCurrencySelect }: Props) => {
  return (
    <div className='token-list'>
      <table className='token-list-table' style={{
      }}>
        {whiteListFilterPools.length > 0 && (
          <tr className='table-head'>
            <th />
            <th />
          </tr>
        )}
        {whiteListFilterPools.map((index, _) => {
          return index.poolGroup.map((pool, __) => {
            const indexKey = oracleToPoolGroupId(pool?.ORACLE || '')
            return (
              <tr
                key={_ + __}
                className='position-token-list'
                onClick={() => handleCurrencySelect(index)}
              >
                <td className='token-item'>
                  <span className='chart-token-selector--current inline-items-center'>
                    <CurrencyGroupLogo currencyURIs={[index.baseToken.logoURI, index.quoteToken.logoURI]} size={36}/>
                    <div className='chart-token-symbol'>
                      <Text>
                        {index.baseToken.symbol} / {index.quoteToken.symbol}
                      </Text><br/>
                      <TextGrey>  {pool?.createAtTimestamp ? moment
                        .unix(pool?.createAtTimestamp)
                        .fromNow()
                        .toLocaleLowerCase() : ''} </TextGrey>
                    </div>

                  </span>
                  <span className='inline-items-center' />
                </td>

                <td className='index-value-item'>

                  {poolGroupsValue[indexKey]?.poolGroupValue > 0 ? <TextGrey>
                    {`${
                          poolGroupsValue[indexKey]?.poolGroupValue !== 0
                            ? `($${formatLocalisedCompactNumber(
                                formatFloat(poolGroupsValue[indexKey]?.poolGroupValue, 2)
                              )})`
                            : ''
                        }`}
                  </TextGrey> : <SkeletonLoader textLoading='   ' loading/> } <br/>
                  <TextGrey>{JSON.stringify(pool.state)}</TextGrey>
                </td>

              </tr>
            )
          })
        })}

        {isLoading && Array(8).fill(0).map((a, _) => <SkeletonLoader height='50px' key={_} loading style={{ width: '100%', marginTop: '1rem' }}/>)}
      </table>
      <TextGrey>Enter to search more</TextGrey>
    </div>
  )
}
