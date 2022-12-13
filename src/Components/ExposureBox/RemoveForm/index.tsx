import React, { useMemo, useState } from 'react'
import { useCurrentPool } from '../../../state/currentPool/hooks/useCurrentPool'
import { useListTokens } from '../../../state/token/hook'
import { Text, TextPink } from '../../ui/Text'
import { TokenIcon } from '../../ui/TokenIcon'
import { TokenSymbol } from '../../ui/TokenSymbol'
import { Input } from '../../ui/Input'
import { bn, numberToWei, weiToNumber } from '../../../utils/helpers'
import { useWalletBalance } from '../../../state/wallet/hooks/useBalances'
import './style.scss'
import { BigNumber } from 'ethers'

export const RemoveForm = ({
  removePercent,
  setRemovePercent,
  totalValue
}: {
  removePercent: number
  setRemovePercent: any
  totalValue: BigNumber
}) => {
  const { cToken, cTokenPrice } = useCurrentPool()
  const { tokens } = useListTokens()
  const { balances } = useWalletBalance()
  const [amount, setAmount] = useState<number>(0)

  const maxAmount = useMemo(() => {
    if (cTokenPrice) {
      return bn(totalValue)
        .mul(numberToWei(1))
        .div(numberToWei(cTokenPrice))
    }
    return bn(numberToWei(1))
  }, [totalValue, cToken, cTokenPrice])

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
        }}
      >Balance: {weiToNumber(balances[cToken], tokens[cToken]?.decimal || 18, 4)}</Text>
    </div>
    <div className='remove-form__input'>
      <Input
        value={amount}
        onChange={(e) => {
          if (Number(e.target?.value) >= 0) {
            setAmount(Number(e.target?.value))
          }
          if (totalValue && totalValue.gt(0)) {
            const percent = bn(numberToWei(e.target?.value)).mul(100000).div(totalValue).toNumber() / 100
            setRemovePercent(percent)
          }
        }}
      />
    </div>
    <div className='remove-form__select-percent'>
      {
        [25, 50, 75, 100].map((percent, key) => {
          return <span
            key={key}
            className={`remove-form__select-percent--option ${removePercent === percent && 'active'}`}
            onClick={() => {
              setRemovePercent(percent)
              setAmount(Number(weiToNumber(maxAmount.mul(percent).div(100))))
            }}
          >{percent}%</span>
        })
      }
      <Input
        className='remove-form__select-percent--custom-percent'
        inputWrapProps={{
          className: 'remove-form__select-percent--custom-percent-wrap'
        }}
        // @ts-ignore
        value={removePercent}
        onChange={(e) => {
          // @ts-ignore
          if (e.target?.value >= 0) {
            // @ts-ignore
            setRemovePercent(e.target?.value)
          }
        }}
      />
    </div>
  </div>
}
