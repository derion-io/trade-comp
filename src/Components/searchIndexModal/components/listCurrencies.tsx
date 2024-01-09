import React from 'react'
import { Token } from '@uniswap/sdk-core'
import { CurrencyLogo } from '../../ui/CurrencyLogo'
import './index.scss'
import { TokenFromList } from '../../../state/lists/tokenFromList'
import { Text, TextGrey } from '../../ui/Text'
import { SkeletonLoader } from '../../ui/SkeletonLoader'
import { TokenFromPoolGroup } from '../../../utils/type'
import { useResource } from '../../../state/resources/hooks/useResource'
import { formatFloat, oracleToPoolGroupId } from '../../../utils/helpers'
import formatLocalisedCompactNumber from '../../../utils/formatBalance'
import { PoolGroupValueType } from '../../../state/resources/type'
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
        borderSpacing: 0
      }}>
        {whiteListFilterPools.length > 0 && (
          <thead className='table-head'>
            <th />
            <th />
          </thead>
        )}
        <tbody className='token-list-tbody' >
          {whiteListFilterPools.map((token, _) => {
            const indexKey = oracleToPoolGroupId(token.poolGroup?.[0]?.ORACLE || '')
            return (
              <tr
                key={_}
                className='position-token-list'
                onClick={() => handleCurrencySelect(token)}
              >
                <td className='token-item'>
                  <span className='chart-token-selector--current inline-items-center'>
                    <CurrencyLogo className='chart-token-current-icon' currencyURI={token.logoURI} size={36} />
                    <div className='chart-token-symbol'>
                      <Text> {token.name} </Text> <br/>
                      <TextGrey>
                        {token.symbol}
                      </TextGrey>
                    </div>

                  </span>
                  <span className='inline-items-center' />
                </td>
                {poolGroupsValue[indexKey]?.poolGroupValue > 0
                  ? <td className='index-value-item'>

                    <TextGrey>
                      {`${
                        poolGroupsValue[indexKey]?.poolGroupValue !== 0
                          ? `($${formatLocalisedCompactNumber(
                              formatFloat(poolGroupsValue[indexKey]?.poolGroupValue, 2)
                            )})`
                          : ''
                      }`}
                    </TextGrey>
                  </td>
                  : <td><SkeletonLoader textLoading='---' loading/></td>}
              </tr>
            )
          })}
        </tbody>

        {isLoading && Array(8).fill(0).map((a, _) => <SkeletonLoader key={_} loading style={{ width: '100%', height: '50px', marginTop: '1rem' }}/>)}
      </table>
      <TextGrey>Enter to search more</TextGrey>
    </div>
  )
}
