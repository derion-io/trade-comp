import { useMemo } from 'react'
import { PoolType } from 'derivable-engine/dist/types'
import { bn, decodeErc1155Address, isErc1155Address, WEI, NUM, DIV, baseRateFromHL } from '../utils/helpers'
import { POOL_IDS } from '../utils/constant'

export function calculatePoolRate(
  inputTokenAddress: string | undefined,
  outputTokenAddress: string | undefined,
  pools: { [key: string]: any },
  poolToShow: any
) {
  const tokenAddress =
    (outputTokenAddress && isErc1155Address(outputTokenAddress))
      ? outputTokenAddress
      : (inputTokenAddress && isErc1155Address(inputTokenAddress))
        ? inputTokenAddress
        : undefined
  if (!tokenAddress) {
    return { baseRate: 0, sideRate: 0, cRate: 0, interest: 0, premium: 0, fundingRate: 0, interestRate: undefined, maxPremiumRate: undefined }
  }
  const { address, id } = decodeErc1155Address(tokenAddress)
  const pool = pools?.[address] ?? poolToShow
  if (!pool) {
    return { baseRate: 0, sideRate: 0, cRate: 0, interest: 0, premium: 0, fundingRate: 0, interestRate: undefined, maxPremiumRate: undefined }
  }
  const { sides, interestRate, maxPremiumRate, INTEREST_HL, states, K } = pool
  if (!sides || !states || !INTEREST_HL || !K) {
      return { baseRate: 0, sideRate: 0, cRate: 0, interest: 0, premium: 0, fundingRate: 0, interestRate: undefined, maxPremiumRate: undefined }
  }
  const { rA, rB, rC } = states
  if (!rA || !rB || !rC) {
    return { baseRate: 0, sideRate: 0, cRate: 0, interest: 0, premium: 0, fundingRate: 0, interestRate: undefined, maxPremiumRate: undefined }
  }
  const kNum = K.toNumber()
  const baseRate = baseRateFromHL(INTEREST_HL.toNumber())
  const sideRate = baseRate * sides[id].k / kNum
  const rAInterest = rA.mul(WEI(baseRate * sides[POOL_IDS.A].k / kNum))
  const rBInterest = rB.mul(WEI(baseRate * sides[POOL_IDS.B].k / kNum))
  const cRate = NUM(DIV(rAInterest.add(rBInterest), rC.mul(bn(10).pow(18)), 4))
  const interest = sides[id].interest ?? 0
  const premium = NUM(sides[id].premium)
  const fundingRate = interest + premium
  return { baseRate, sideRate, cRate, interest, premium, fundingRate, interestRate, maxPremiumRate }
}

export const usePoolRate = (
  inputTokenAddress: string | undefined,
  outputTokenAddress: string | undefined,
  pools: { [key: string]: any },
  poolToShow: any
) => {
  return useMemo(() => calculatePoolRate(inputTokenAddress, outputTokenAddress, pools, poolToShow), [inputTokenAddress, outputTokenAddress, pools, poolToShow])
} 