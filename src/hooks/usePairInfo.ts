import { ethers } from 'ethers'
import { useContract } from './useContract'

export const usePairInfo = () => {
  const { getPairInfoContract } = useContract()
  const getPairInfo = async (pairAddress: any) => {
    try {
      const tokenContract = getPairInfoContract()
      const res = await tokenContract.functions.query(
        [pairAddress],
        '0x0000110000000000000000000000000000000000000000000000000000000100'
      )
      console.log(res)
      return res.details[0]
    } catch (e) {
      // console.error(e)
      return {}
    }
  }
  return { getPairInfo }
}
