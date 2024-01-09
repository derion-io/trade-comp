import React from 'react'
import { Token } from '@uniswap/sdk-core'
import { CurrencyLogo } from '../../ui/CurrencyLogo'
import './index.scss'
import { TokenFromList } from '../../../state/lists/tokenFromList'
import { Text, TextGrey } from '../../ui/Text'
type Props = {
  currencies: TokenFromList[]
}
export const ListCurrencies = ({ currencies }: Props) => {
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
              >
                <td className='token-item'>
                  <span className='chart-token-selector--current inline-items-center'>
                    <CurrencyLogo className='chart-token-current-icon' currencyURI={token.tokenInfo.logoURI} size={36} />
                    <div className='chart-token-symbol'>
                      <Text> {token.tokenInfo.name} </Text> <br/>
                      <TextGrey>
                        {token.tokenInfo.symbol}
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
      </table>
    </div>
  )
}
