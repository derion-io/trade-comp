import { ethers } from 'ethers'
import PoolAbi from '../assets/abi/Pool.json'
import { useConfigs } from '../state/config/useConfigs'
import { JsonRpcProvider } from '@ethersproject/providers'

export const useContract = () => {
  const { configs } = useConfigs()
  const getContract = (
    abi: any,
    address: string,
    signer?: ethers.Signer | ethers.providers.Provider
  ) => {
    const signerOrProvider = signer || new JsonRpcProvider(configs.rpc)
    return new ethers.Contract(address, abi, signerOrProvider)
  }

  const getPoolContract = (
    poolAddress: string,
    signer?: ethers.Signer | ethers.providers.Provider
  ) => {
    return getContract(PoolAbi, poolAddress, signer)
  }

  return {
    getPoolContract
  }
}
