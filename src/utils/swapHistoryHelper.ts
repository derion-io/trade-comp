import { BigNumber } from 'ethers'
import { bn } from './helpers'

export const getErc20AmountChange = (oldBalances: { [key: number]: BigNumber }, newBalances: { [key: number]: BigNumber }, id: number | string) => {
  return bn(oldBalances && oldBalances[id]
    ? oldBalances[id] : 0
  ).sub(newBalances && newBalances[id]
    ? newBalances[id] : 0
  )
}
