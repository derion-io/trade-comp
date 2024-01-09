import { Currency } from '@uniswap/sdk-core'
import { TokenInfo } from '@uniswap/token-lists'
import React from 'react'
import { useTokenInfoFromActiveList } from '../../../hooks/useTokenInfoFromActiveList'
import { COMMON_BASES } from '../../../state/lists/constants/routing'
import { CurrencyLogo } from '../../ui/CurrencyLogo'
import { Text } from '../../ui/Text'
import './index.scss'
export const CommonCurrencies = () => {
  const chainId = 56
  const bases = COMMON_BASES[chainId]

  return (
    <div className='common-currencies'>
      {bases.map((currency: Currency, _:number) => {
        return (
          <div
            key={_}
            className='common-currencies__item'
          >
            <span className='chart-token-selector--current inline-items-center' >
              <CurrencyLogoFromList currency={currency} chainId={chainId}/>
              <Text fontWeight={535} fontSize={16}>
                {currency.symbol}
              </Text>
            </span>
          </div>
        )
      })}
    </div>
  )
}

function CurrencyLogoFromList({ currency, chainId }: { currency: Currency, chainId: number }) {
  const token = useTokenInfoFromActiveList(currency, chainId)
  return <CurrencyLogo currencyURI={(token as TokenInfo).logoURI} size={24} />
}
