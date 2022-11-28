import { ethers } from 'ethers'
import { useContract } from './useContract'

export const usePairInfo = () => {
  const { getPairInfoContract } = useContract()
  const getPairInfo = async (pairAddress: any) => {
    try {
      const tokenContract = getPairInfoContract()
      const res = await tokenContract.functions.query(
        [pairAddress],
        '0x0000110000000000000000000000000000000000000000000000000000000111'
      )
      console.log(res)
      return res.details[0]
    } catch (e) {
      // console.error(e)
      return {}
    }
  }

  const getPairsInfo = async (pairAddresses: any) => {
    try {
      const tokenContract = getPairInfoContract()
      const { details } = await tokenContract.functions.query(
        pairAddresses,
        '0x0000110000000000000000000000000000000000000000000000000000000111'
      )
      console.log(details, pairAddresses)
      const result = {}
      for (let i = 0; i < pairAddresses.length; i++) {
        result[pairAddresses[i]] = details[i]
      }
      console.log(result)
      return result
    } catch (e) {
      // console.error(e)
      return {}
    }
  }

  return { getPairInfo, getPairsInfo }
}
