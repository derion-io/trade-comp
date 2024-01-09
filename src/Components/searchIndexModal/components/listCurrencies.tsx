import React from 'react'
import { Token } from '@uniswap/sdk-core'
import { CurrencyLogo } from '../../ui/CurrencyLogo'
import './index.scss'
import { TokenFromList } from '../../../state/lists/tokenFromList'
import { Text, TextGrey } from '../../ui/Text'
import { SkeletonLoader } from '../../ui/SkeletonLoader'
import { TokenFromPoolGroup } from '../../../utils/type'
type Props = {
  currencies: TokenFromPoolGroup[],
  handleCurrencySelect: (currency: TokenFromPoolGroup, hasWarning?: boolean) => void
  isLoading: boolean
}
export const ListCurrencies = ({ currencies, isLoading = false, handleCurrencySelect }: Props) => {
  return (
    <div className='token-list'>
      <table className='token-list-table'>
        {currencies.length > 0 && (
          <thead className='table-head'>
            <tr />
          </thead>
        )}
        <tbody className='token-list-tbody'>
          {currencies.map((token, _) => {
            return (
              <div
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
                {/* <td>$1123</td>
                <td>$123</td> */}
              </div>
            )
          })}
        </tbody>

        {isLoading && Array(8).fill(0).map((a, _) => <SkeletonLoader key={_} loading style={{ width: '100%', height: '50px', marginTop: '1rem' }}/>)}
      </table>
      <TextGrey>Enter to search more</TextGrey>
    </div>
  )
}
