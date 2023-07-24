import { useEffect, useState } from 'react'
import { useContract } from './useContract'
import { bn, decodeErc1155Address, isErc1155Address } from '../utils/helpers'
import { packId } from 'derivable-tools/dist/utils/helper'
import { useWeb3React } from '../state/customWeb3React/hook'
import { BigNumber } from 'ethers'

export const useMaturity = (tokenOut: string) => {
  const [maturity, setMaturity] = useState<BigNumber>(bn(0))
  const { getTokenPositionContract } = useContract()
  const { account } = useWeb3React()
  useEffect(() => {
    fetchData().then((e) => setMaturity(e)).catch(console.error)
    const inteval = setInterval(() => {
      fetchData().then((e) => setMaturity(e)).catch(console.error)
    }, 5000)
    return () => {
      clearInterval(inteval)
    }
  }, [tokenOut])

  const fetchData = async (): Promise<BigNumber> => {
    if (isErc1155Address(tokenOut)) {
      const { id, address } = decodeErc1155Address(tokenOut)
      const contract = getTokenPositionContract()
      return await contract.maturityOf(account, packId(id, address))
    } else {
      return bn(0)
    }
  }

  return maturity
}
