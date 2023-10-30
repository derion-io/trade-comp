import React from 'react'
import { formatFloat, zerofy } from '../../../utils/helpers'
import formatLocalisedCompactNumber from '../../../utils/formatBalance'
import { Text, TextGrey } from '../../ui/Text'
import { TokenSymbol } from '../../ui/TokenSymbol'
import { TokenIcon } from '../../ui/TokenIcon'
import { isErc1155Address } from 'derivable-tools/dist/utils/helper'

type Props = {
  amountIn: string
  valueIn: string
  tokenAddress: string
  textBefore?: string
}
export const SwapModalHeaderAmount = ({
  amountIn,
  valueIn,
  tokenAddress,
  textBefore
}: Props) => {
  return (
    <div className='amount-input-box__head' style={{ margin: 0 }}>
      <span className='current-token' style={{ width: '100%' }}>
        <span className='text-grey' style={{ textAlign: 'center', width: '100%' }}>
          <span className='current-token' style={{ justifyContent: 'center' }}>
            <Text className='fs-16'>
              {textBefore || ''} {zerofy(formatFloat(amountIn, undefined, 8, true), { maxZeros: 8 })}{' '}
            </Text>
            {!isErc1155Address(tokenAddress) ? <TokenIcon size={16} className='ml-0.1' tokenAddress={tokenAddress} /> : ''} {' '}
            <TokenSymbol
              className='fs-16'
              color='default'
              token={tokenAddress}
            />{' '}
            {Number(valueIn) > 0 ? (
              <TextGrey className='fs-16'>
              (${formatLocalisedCompactNumber(formatFloat(valueIn))})
              </TextGrey>
            ) : (
              ''
            )}
          </span>
        </span>
      </span>
      {/* <div className='d-flex align-item-center'>
      <TokenIcon size={24} tokenAddress={tokenAddress} />
    </div> */}
    </div>
  )
}
