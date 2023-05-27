import { useMemo } from 'react'
import { bn, formatFloat, numberToWei, weiToNumber } from '../../../utils/helpers'
import { BigNumber } from 'ethers'

export const useTokenValue = ({
  amount,
  token
}: {
  amount: BigNumber,
  token: string
}) => {
  const valueOut = useMemo(() => {
    return formatFloat(weiToNumber(bn(numberToWei(amount)).mul(numberToWei(1)), 36), 2)
  }, [])
  return valueOut
}
