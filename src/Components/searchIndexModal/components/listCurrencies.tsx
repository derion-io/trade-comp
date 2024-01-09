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
import { CurrencyGroupLogo } from '../../ui/CurrencyGroupLogo'
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
          const indexKey = oracleToPoolGroupId(index.poolGroup?.[0]?.ORACLE || '')
          return (
            <tr
              key={_}
              className='position-token-list'
              onClick={() => handleCurrencySelect(index)}
            >
              <td className='token-item'>
                <span className='chart-token-selector--current inline-items-center'>
                  <CurrencyGroupLogo currencyURIs={[index.baseToken.logoURI, index.quoteToken.logoURI]} size={36}/>
                  <div className='chart-token-symbol'>
                    {/* <Text> {token.baseToken.name} </Text> <br/> */}
                    <TextGrey>
                      {index.baseToken.symbol} / {index.quoteToken.symbol}
                    </TextGrey>
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
                </TextGrey> : <SkeletonLoader textLoading='   ' loading/> }
              </td>

            </tr>
          )
        })}

        {isLoading && Array(8).fill(0).map((a, _) => <SkeletonLoader height='50px' key={_} loading style={{ width: '100%', marginTop: '1rem' }}/>)}
      </table>
      <TextGrey>Enter to search more</TextGrey>
    </div>
  )
}
