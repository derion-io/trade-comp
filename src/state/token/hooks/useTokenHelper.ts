import { ethers } from 'ethers'
import IERC20 from '../../../assets/abi/IERC20.json'
import { TokenType } from '../type'
import { useContract } from '../../../hooks/useContract'
import { useConfigs } from '../../config/useConfigs'
import { JsonRpcProvider } from '@ethersproject/providers'

export const useTokenHelper = () => {
  const { getTokenInfoContract } = useContract()
  const { configs } = useConfigs()

  const getTokenFromAddresses = async (
    addresses: string[],
    hideInSearchModal = false
  ): Promise<TokenType[]> => {
    try {
      const tokenInfoContract = getTokenInfoContract()

      const res = await tokenInfoContract.getTokenInfo(addresses)
      console.log('res', res)
      return res.map((r: any, key: number) => {
        return {
          decimal: r.decimals,
          name: r.name?.replace(/\0/g, ''),
          symbol: r.symbol?.replace(/\0/g, ''),
          icon: null,
          address: addresses[key],
          hideInSearchModal
        }
      })
    } catch (e) {
      console.error(e)
      return []
    }
  }

  const getTokenDecimal = async (address: string) => {
    try {
      const provider = new JsonRpcProvider(configs.rpcUrl)
      const tokenContract = new ethers.Contract(address, IERC20, provider)
      return await tokenContract.functions.decimals().then((r: any) => r[0])
    } catch (e) {
      console.error(e)
      return 18
    }
  }

  return {
    getTokenDecimal,
    getTokenFromAddresses
  }
}
