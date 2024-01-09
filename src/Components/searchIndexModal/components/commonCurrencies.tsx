import React, { Fragment } from 'react'
import { COMMON_BASES } from '../../../state/lists/constants/routing'
import { Text } from '../../ui/Text'
import '../style.scss'
export const CommonCurrencies = () => {
  const bases = COMMON_BASES[56] ?? []
  return (<Fragment />
  // <AutoRow gap='4px'>
  //   {bases.map((currency, _) => {
  //     // const isSelected = selectedCurrency?.equals(currency)

  //     return (
  //       <div key = {_}>
  //         <BaseWrapper
  //           tabIndex={0}
  //           // onKeyPress={(e) => !isSelected && e.key === 'Enter' && onSelect(currency)}
  //           // onClick={() => !isSelected && onSelect(currency)}
  //           // disable={isSelected}
  //           // key={currencyId(currency)}
  //           data-testid={`common-base-${currency.symbol}`}
  //         >
  //           <CurrencyLogoFromList currency={currency} />
  //           <Text fontWeight={535} fontSize={16} lineHeight='16px'>
  //             {currency.symbol}
  //           </Text>
  //         </BaseWrapper>
  //       </div>
  //     )
  //   })}
  // </AutoRow>
  // <div className='common-currenies' style={{ margin: 0 }} >
  //   {
  //     Object.keys(commonCurrenies).map((k, _) => {
  //       return (
  //         <span
  //           className='common-currenies__infor'
  //           key={_}
  //         >
  //           <span className=''>
  //             <CurrencyLogo size={36} currencyURI={commonCurrenies[k].tokenInfo.logoURI} />
  //             <div className='common-currenies__text'>
  //               <Text>
  //                 {commonCurrenies[k].tokenInfo.name || ''}
  //               </Text>
  //               <TextGrey>
  //                 {commonCurrenies[k].tokenInfo.symbol || ''}
  //               </TextGrey>
  //             </div>
  //           </span>
  //         </span>
  //       )
  //     })
  //   }

  // </div>
  )
}
