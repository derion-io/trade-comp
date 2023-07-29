import { BigNumber, ethers } from 'ethers'
import { useConfigs } from '../state/config/useConfigs'

export const useFeeData = () => {
  const { configs } = useConfigs()
  const getFeeData = async () => {
    try {
      const provider = new ethers.providers.JsonRpcProvider(configs.rpcUrl)
      const feeData = await provider.getFeeData()
      return {
        gasPrice: feeData.gasPrice
      }
    } catch (error) {
      console.error(error)
      return {
        gasPrice: BigNumber.from(1)
      }
    }
  }

  return {
    getFeeData
  }
}
