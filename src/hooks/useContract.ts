import { ethers } from 'ethers'
import * as WbnbAbi from '../assets/abi/Wbnb.json'
import IERC20ABI from '../assets/abi/IERC20.json'
import BnAAbi from '../assets/abi/BnA.json'
import TokensInfoAbi from '../assets/abi/TokensInfo.json'
import PairDetailAbi from '../assets/abi/PairDetail.json'
import RouterAbi from '../assets/abi/Router.json'
import TokenFactoryAbi from '../assets/abi/TokenFactory.json'
import PoolFactoryAbi from '../assets/abi/PoolFactory.json'
import PoolAbi from '../assets/abi/Pool.json'
import EventsAbi from '../assets/abi/Events.json'
import { useConfigs } from '../state/config/useConfigs'
import { JsonRpcProvider } from '@ethersproject/providers'
import LogicAbi56 from '../assets/abi/56/Logic.json'
import LogicAbi97 from '../assets/abi/97/Logic.json'
import LogicAbi31337 from '../assets/abi/31337/Logic.json'

const LogicAbi = {
  56: LogicAbi56,
  97: LogicAbi97,
  31337: LogicAbi31337
}

export const useContract = () => {
  const { configs, chainId } = useConfigs()
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
    const abi = getLogicAbi()
    return getContract(abi, logicAddress, signer)
  }

  const getEventInterface = () => {
    return new ethers.utils.Interface(EventsAbi)
  }

  const getLogicAbi = () => {
    return LogicAbi[chainId]
  }

  return {
    getLogicAbi,
    getTokenInfoContract,
    getBnAContract,
    getLogicContract,
    getWbnbContract,
    getERC20Contract,
    getRouterContract,
    getTokenFactoryContract,
    getPoolFactoryContract,
    getPoolContract,
    getPairInfoContract,
    getEventInterface
  }
}
