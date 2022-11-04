import { ethers } from 'ethers'
import * as WbnbAbi from '../assets/abi/Wbnb.json'
import IERC20ABI from '../assets/abi/IERC20.json'
import BnAAbi from '../assets/abi/BnA.json'
import LogicAbi from '../assets/abi/Logic.json'
import TokensInfoAbi from '../assets/abi/TokensInfo.json'
import PairDetailAbi from '../assets/abi/PairDetail.json'
import RouterAbi from '../assets/abi/Router.json'
import TokenFactoryAbi from '../assets/abi/TokenFactory.json'
import PoolFactoryAbi from '../assets/abi/PoolFactory.json'
import PoolAbi from '../assets/abi/Pool.json'
import { useConfigs } from '../state/config/useConfigs'
import { JsonRpcProvider } from '@ethersproject/providers'
import { overrideContract } from '../utils/helpers'

export const useContract = () => {
  const { configs } = useConfigs()
  const getContract = (
    abi: any,
    address: string,
    signer?: ethers.Signer | ethers.providers.Provider
  ) => {
    const signerOrProvider = signer || new JsonRpcProvider(configs.rpcUrl)
    return new ethers.Contract(address, abi, signerOrProvider)
  }

  const getERC20Contract = (
    address: string,
    signer?: ethers.Signer | ethers.providers.Provider
  ) => {
    return getContract(IERC20ABI, address, signer)
  }

  const getWbnbContract = (
    signer?: ethers.Signer | ethers.providers.Provider
  ) => {
    return getContract(WbnbAbi, configs.addresses.wrapToken, signer)
  }

  const getBnAContract = () => {
    return getContract(BnAAbi, configs.addresses.bnA)
  }

  const getTokenInfoContract = () => {
    return getContract(TokensInfoAbi, configs.addresses.tokensInfo)
  }

  const getPairInfoContract = () => {
    return getContract(PairDetailAbi, configs.addresses.pairsInfo)
  }

  const getRouterContract = (
    signer?: ethers.Signer | ethers.providers.Provider
  ) => {
    return getContract(RouterAbi, configs.addresses.router, signer)
  }

  const getTokenFactoryContract = (
    signer?: ethers.Signer | ethers.providers.Provider
  ) => {
    return getContract(TokenFactoryAbi, configs.addresses.tokenFactory, signer)
  }

  const getPoolFactoryContract = (
    signer?: ethers.Signer | ethers.providers.Provider
  ) => {
    return getContract(PoolFactoryAbi, configs.addresses.poolFactory, signer)
  }

  const getPoolContract = (
    poolAddress: string,
    signer?: ethers.Signer | ethers.providers.Provider
  ) => {
    return getContract(PoolAbi, poolAddress, signer)
  }

  const getLogicContract = (
    logicAddress: string,
    signer?: ethers.Signer | ethers.providers.Provider
  ) => {
    return getContract(LogicAbi, logicAddress, signer)
  }

  return {
    getTokenInfoContract,
    getBnAContract,
    getLogicContract,
    getWbnbContract,
    getERC20Contract,
    getRouterContract,
    getTokenFactoryContract,
    getPoolFactoryContract,
    getPoolContract,
    getPairInfoContract
  }
}
