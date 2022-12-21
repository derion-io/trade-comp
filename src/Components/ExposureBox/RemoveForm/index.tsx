import React, { useMemo, useState } from 'react'
import { useCurrentPool } from '../../../state/currentPool/hooks/useCurrentPool'
import { useListTokens } from '../../../state/token/hook'
import { Text, TextGrey, TextPink } from '../../ui/Text'
import { TokenIcon } from '../../ui/TokenIcon'
import { TokenSymbol } from '../../ui/TokenSymbol'
import { Input } from '../../ui/Input'
import { bn, formatFloat, numberToWei, weiToNumber } from '../../../utils/helpers'
import { useWalletBalance } from '../../../state/wallet/hooks/useBalances'
import './style.scss'
import { BigNumber } from 'ethers'
import { ButtonBorder } from '../../ui/Button'

export const RemoveForm = ({
  removePercent,
  setRemovePercent,
  totalValue
}: {
  removePercent?: number
  setRemovePercent: any
  totalValue: BigNumber
}) => {
  const { cToken, cTokenPrice } = useCurrentPool()
  const { tokens } = useListTokens()
  const [amount, setAmount] = useState<string>()
  const [unit, setUnit] = useState<'amount' | 'percent'>('percent')

  const maxAmount = useMemo(() => {
    if (cTokenPrice) {
      return bn(totalValue)
        .mul(numberToWei(1))
        .div(numberToWei(cTokenPrice))
    }
    return bn(numberToWei(1))
  }, [totalValue, cToken, cTokenPrice])
  const value = useMemo(() => {
    if (amount && cTokenPrice) {
      return formatFloat(weiToNumber(bn(numberToWei(amount)).mul(numberToWei(cTokenPrice || 0)), 36), 2)
    }
    return 0
  }, [amount, cTokenPrice])

  return <div className='remove-from'>
    <div className='remove-form__head'>
      <TextPink className='amount-input-box__head--left cursor-pointer text-decoration-none' onClick={() => {
      }}>
        <TokenIcon size={24} className='mr-05' tokenAddress={cToken} />
        <TokenSymbol token={tokens[cToken]} />
      </TextPink>
      <Text
        className='cursor-pointer'
        onClick={() => {
          setRemovePercent(100)
          setAmount(weiToNumber(maxAmount))
        }}
      >Max: {weiToNumber(maxAmount, tokens[cToken]?.decimal || 18, 4)}</Text>
    </div>
    <div className='remove-form__input'>
      {
        unit === 'amount'
          ? <Input
            inputWrapProps={{
              className: 'remove-form__input--input-wrap'
            }}
            value={amount}
            type='number'
            onChange={(e) => {
              if (Number(e.target?.value) >= 0) {
                setAmount(e.target?.value)
              }
              if (totalValue && totalValue.gt(0)) {
                const percent = bn(numberToWei(e.target?.value)).mul(100000).div(totalValue).toNumber() / 100
                setRemovePercent(percent)
              }
            }}
            placeholder='0.0'
            suffix={<TextGrey>${value > 0 ? value : ''}</TextGrey>}
          />
          : <Input
            inputWrapProps={{
              className: 'remove-form__input--input-wrap'
            }}
            value={removePercent}
            type='number'
            onChange={(e) => {
              // @ts-ignore
              if (e.target?.value >= 0) {
                // @ts-ignore
                setRemovePercent(e.target?.value)
              }
            }}
            placeholder='0.0'
            suffix={<TextGrey>%</TextGrey>}
          />
      }
      <ButtonBorder
        className='remove-form__btn-change-unit'
        onClick={() => {
          setUnit(unit === 'amount' ? 'percent' : 'amount')
        }}>
        {unit === 'amount' ? '%' : 'Value'}
      </ButtonBorder>
    </div>
    <div className='remove-form__select-percent'>
      {
        [25, 50, 75, 100].map((percent, key) => {
          return <span
            key={key}
            className={`remove-form__select-percent--option ${removePercent === percent && 'active'}`}
            onClick={() => {
              setRemovePercent(percent)
              setAmount(weiToNumber(maxAmount.mul(percent).div(100)))
            }}
          >{percent}%</span>
        })
      }
    </div>
  </div>
}
