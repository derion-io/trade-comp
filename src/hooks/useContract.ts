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

export const routerAbi = [{ inputs: [{ internalType: 'address', name: '_factory', type: 'address' }, { internalType: 'address', name: '_WETH', type: 'address' }], stateMutability: 'nonpayable', type: 'constructor' }, { inputs: [], name: 'WETH', outputs: [{ internalType: 'address', name: '', type: 'address' }], stateMutability: 'view', type: 'function' }, { inputs: [{ internalType: 'address', name: 'tokenA', type: 'address' }, { internalType: 'address', name: 'tokenB', type: 'address' }, { internalType: 'uint256', name: 'amountADesired', type: 'uint256' }, { internalType: 'uint256', name: 'amountBDesired', type: 'uint256' }, { internalType: 'uint256', name: 'amountAMin', type: 'uint256' }, { internalType: 'uint256', name: 'amountBMin', type: 'uint256' }, { internalType: 'address', name: 'to', type: 'address' }, { internalType: 'uint256', name: 'deadline', type: 'uint256' }], name: 'addLiquidity', outputs: [{ internalType: 'uint256', name: 'amountA', type: 'uint256' }, { internalType: 'uint256', name: 'amountB', type: 'uint256' }, { internalType: 'uint256', name: 'liquidity', type: 'uint256' }], stateMutability: 'nonpayable', type: 'function' }, { inputs: [{ internalType: 'address', name: 'token', type: 'address' }, { internalType: 'uint256', name: 'amountTokenDesired', type: 'uint256' }, { internalType: 'uint256', name: 'amountTokenMin', type: 'uint256' }, { internalType: 'uint256', name: 'amountETHMin', type: 'uint256' }, { internalType: 'address', name: 'to', type: 'address' }, { internalType: 'uint256', name: 'deadline', type: 'uint256' }], name: 'addLiquidityETH', outputs: [{ internalType: 'uint256', name: 'amountToken', type: 'uint256' }, { internalType: 'uint256', name: 'amountETH', type: 'uint256' }, { internalType: 'uint256', name: 'liquidity', type: 'uint256' }], stateMutability: 'payable', type: 'function' }, { inputs: [], name: 'factory', outputs: [{ internalType: 'address', name: '', type: 'address' }], stateMutability: 'view', type: 'function' }, { inputs: [{ internalType: 'uint256', name: 'amountOut', type: 'uint256' }, { internalType: 'uint256', name: 'reserveIn', type: 'uint256' }, { internalType: 'uint256', name: 'reserveOut', type: 'uint256' }], name: 'getAmountIn', outputs: [{ internalType: 'uint256', name: 'amountIn', type: 'uint256' }], stateMutability: 'pure', type: 'function' }, { inputs: [{ internalType: 'uint256', name: 'amountIn', type: 'uint256' }, { internalType: 'uint256', name: 'reserveIn', type: 'uint256' }, { internalType: 'uint256', name: 'reserveOut', type: 'uint256' }], name: 'getAmountOut', outputs: [{ internalType: 'uint256', name: 'amountOut', type: 'uint256' }], stateMutability: 'pure', type: 'function' }, { inputs: [{ internalType: 'uint256', name: 'amountOut', type: 'uint256' }, { internalType: 'address[]', name: 'path', type: 'address[]' }], name: 'getAmountsIn', outputs: [{ internalType: 'uint256[]', name: 'amounts', type: 'uint256[]' }], stateMutability: 'view', type: 'function' }, { inputs: [{ internalType: 'uint256', name: 'amountIn', type: 'uint256' }, { internalType: 'address[]', name: 'path', type: 'address[]' }], name: 'getAmountsOut', outputs: [{ internalType: 'uint256[]', name: 'amounts', type: 'uint256[]' }], stateMutability: 'view', type: 'function' }, { inputs: [{ internalType: 'uint256', name: 'amountA', type: 'uint256' }, { internalType: 'uint256', name: 'reserveA', type: 'uint256' }, { internalType: 'uint256', name: 'reserveB', type: 'uint256' }], name: 'quote', outputs: [{ internalType: 'uint256', name: 'amountB', type: 'uint256' }], stateMutability: 'pure', type: 'function' }, { inputs: [{ internalType: 'address', name: 'tokenA', type: 'address' }, { internalType: 'address', name: 'tokenB', type: 'address' }, { internalType: 'uint256', name: 'liquidity', type: 'uint256' }, { internalType: 'uint256', name: 'amountAMin', type: 'uint256' }, { internalType: 'uint256', name: 'amountBMin', type: 'uint256' }, { internalType: 'address', name: 'to', type: 'address' }, { internalType: 'uint256', name: 'deadline', type: 'uint256' }], name: 'removeLiquidity', outputs: [{ internalType: 'uint256', name: 'amountA', type: 'uint256' }, { internalType: 'uint256', name: 'amountB', type: 'uint256' }], stateMutability: 'nonpayable', type: 'function' }, { inputs: [{ internalType: 'address', name: 'token', type: 'address' }, { internalType: 'uint256', name: 'liquidity', type: 'uint256' }, { internalType: 'uint256', name: 'amountTokenMin', type: 'uint256' }, { internalType: 'uint256', name: 'amountETHMin', type: 'uint256' }, { internalType: 'address', name: 'to', type: 'address' }, { internalType: 'uint256', name: 'deadline', type: 'uint256' }], name: 'removeLiquidityETH', outputs: [{ internalType: 'uint256', name: 'amountToken', type: 'uint256' }, { internalType: 'uint256', name: 'amountETH', type: 'uint256' }], stateMutability: 'nonpayable', type: 'function' }, { inputs: [{ internalType: 'address', name: 'token', type: 'address' }, { internalType: 'uint256', name: 'liquidity', type: 'uint256' }, { internalType: 'uint256', name: 'amountTokenMin', type: 'uint256' }, { internalType: 'uint256', name: 'amountETHMin', type: 'uint256' }, { internalType: 'address', name: 'to', type: 'address' }, { internalType: 'uint256', name: 'deadline', type: 'uint256' }], name: 'removeLiquidityETHSupportingFeeOnTransferTokens', outputs: [{ internalType: 'uint256', name: 'amountETH', type: 'uint256' }], stateMutability: 'nonpayable', type: 'function' }, { inputs: [{ internalType: 'address', name: 'token', type: 'address' }, { internalType: 'uint256', name: 'liquidity', type: 'uint256' }, { internalType: 'uint256', name: 'amountTokenMin', type: 'uint256' }, { internalType: 'uint256', name: 'amountETHMin', type: 'uint256' }, { internalType: 'address', name: 'to', type: 'address' }, { internalType: 'uint256', name: 'deadline', type: 'uint256' }, { internalType: 'bool', name: 'approveMax', type: 'bool' }, { internalType: 'uint8', name: 'v', type: 'uint8' }, { internalType: 'bytes32', name: 'r', type: 'bytes32' }, { internalType: 'bytes32', name: 's', type: 'bytes32' }], name: 'removeLiquidityETHWithPermit', outputs: [{ internalType: 'uint256', name: 'amountToken', type: 'uint256' }, { internalType: 'uint256', name: 'amountETH', type: 'uint256' }], stateMutability: 'nonpayable', type: 'function' }, { inputs: [{ internalType: 'address', name: 'token', type: 'address' }, { internalType: 'uint256', name: 'liquidity', type: 'uint256' }, { internalType: 'uint256', name: 'amountTokenMin', type: 'uint256' }, { internalType: 'uint256', name: 'amountETHMin', type: 'uint256' }, { internalType: 'address', name: 'to', type: 'address' }, { internalType: 'uint256', name: 'deadline', type: 'uint256' }, { internalType: 'bool', name: 'approveMax', type: 'bool' }, { internalType: 'uint8', name: 'v', type: 'uint8' }, { internalType: 'bytes32', name: 'r', type: 'bytes32' }, { internalType: 'bytes32', name: 's', type: 'bytes32' }], name: 'removeLiquidityETHWithPermitSupportingFeeOnTransferTokens', outputs: [{ internalType: 'uint256', name: 'amountETH', type: 'uint256' }], stateMutability: 'nonpayable', type: 'function' }, { inputs: [{ internalType: 'address', name: 'tokenA', type: 'address' }, { internalType: 'address', name: 'tokenB', type: 'address' }, { internalType: 'uint256', name: 'liquidity', type: 'uint256' }, { internalType: 'uint256', name: 'amountAMin', type: 'uint256' }, { internalType: 'uint256', name: 'amountBMin', type: 'uint256' }, { internalType: 'address', name: 'to', type: 'address' }, { internalType: 'uint256', name: 'deadline', type: 'uint256' }, { internalType: 'bool', name: 'approveMax', type: 'bool' }, { internalType: 'uint8', name: 'v', type: 'uint8' }, { internalType: 'bytes32', name: 'r', type: 'bytes32' }, { internalType: 'bytes32', name: 's', type: 'bytes32' }], name: 'removeLiquidityWithPermit', outputs: [{ internalType: 'uint256', name: 'amountA', type: 'uint256' }, { internalType: 'uint256', name: 'amountB', type: 'uint256' }], stateMutability: 'nonpayable', type: 'function' }, { inputs: [{ internalType: 'uint256', name: 'amountOut', type: 'uint256' }, { internalType: 'address[]', name: 'path', type: 'address[]' }, { internalType: 'address', name: 'to', type: 'address' }, { internalType: 'uint256', name: 'deadline', type: 'uint256' }], name: 'swapETHForExactTokens', outputs: [{ internalType: 'uint256[]', name: 'amounts', type: 'uint256[]' }], stateMutability: 'payable', type: 'function' }, { inputs: [{ internalType: 'uint256', name: 'amountOutMin', type: 'uint256' }, { internalType: 'address[]', name: 'path', type: 'address[]' }, { internalType: 'address', name: 'to', type: 'address' }, { internalType: 'uint256', name: 'deadline', type: 'uint256' }], name: 'swapExactETHForTokens', outputs: [{ internalType: 'uint256[]', name: 'amounts', type: 'uint256[]' }], stateMutability: 'payable', type: 'function' }, { inputs: [{ internalType: 'uint256', name: 'amountOutMin', type: 'uint256' }, { internalType: 'address[]', name: 'path', type: 'address[]' }, { internalType: 'address', name: 'to', type: 'address' }, { internalType: 'uint256', name: 'deadline', type: 'uint256' }], name: 'swapExactETHForTokensSupportingFeeOnTransferTokens', outputs: [], stateMutability: 'payable', type: 'function' }, { inputs: [{ internalType: 'uint256', name: 'amountIn', type: 'uint256' }, { internalType: 'uint256', name: 'amountOutMin', type: 'uint256' }, { internalType: 'address[]', name: 'path', type: 'address[]' }, { internalType: 'address', name: 'to', type: 'address' }, { internalType: 'uint256', name: 'deadline', type: 'uint256' }], name: 'swapExactTokensForETH', outputs: [{ internalType: 'uint256[]', name: 'amounts', type: 'uint256[]' }], stateMutability: 'nonpayable', type: 'function' }, { inputs: [{ internalType: 'uint256', name: 'amountIn', type: 'uint256' }, { internalType: 'uint256', name: 'amountOutMin', type: 'uint256' }, { internalType: 'address[]', name: 'path', type: 'address[]' }, { internalType: 'address', name: 'to', type: 'address' }, { internalType: 'uint256', name: 'deadline', type: 'uint256' }], name: 'swapExactTokensForETHSupportingFeeOnTransferTokens', outputs: [], stateMutability: 'nonpayable', type: 'function' }, { inputs: [{ internalType: 'uint256', name: 'amountIn', type: 'uint256' }, { internalType: 'uint256', name: 'amountOutMin', type: 'uint256' }, { internalType: 'address[]', name: 'path', type: 'address[]' }, { internalType: 'address', name: 'to', type: 'address' }, { internalType: 'uint256', name: 'deadline', type: 'uint256' }], name: 'swapExactTokensForTokens', outputs: [{ internalType: 'uint256[]', name: 'amounts', type: 'uint256[]' }], stateMutability: 'nonpayable', type: 'function' }, { inputs: [{ internalType: 'uint256', name: 'amountIn', type: 'uint256' }, { internalType: 'uint256', name: 'amountOutMin', type: 'uint256' }, { internalType: 'address[]', name: 'path', type: 'address[]' }, { internalType: 'address', name: 'to', type: 'address' }, { internalType: 'uint256', name: 'deadline', type: 'uint256' }], name: 'swapExactTokensForTokensSupportingFeeOnTransferTokens', outputs: [], stateMutability: 'nonpayable', type: 'function' }, { inputs: [{ internalType: 'uint256', name: 'amountOut', type: 'uint256' }, { internalType: 'uint256', name: 'amountInMax', type: 'uint256' }, { internalType: 'address[]', name: 'path', type: 'address[]' }, { internalType: 'address', name: 'to', type: 'address' }, { internalType: 'uint256', name: 'deadline', type: 'uint256' }], name: 'swapTokensForExactETH', outputs: [{ internalType: 'uint256[]', name: 'amounts', type: 'uint256[]' }], stateMutability: 'nonpayable', type: 'function' }, { inputs: [{ internalType: 'uint256', name: 'amountOut', type: 'uint256' }, { internalType: 'uint256', name: 'amountInMax', type: 'uint256' }, { internalType: 'address[]', name: 'path', type: 'address[]' }, { internalType: 'address', name: 'to', type: 'address' }, { internalType: 'uint256', name: 'deadline', type: 'uint256' }], name: 'swapTokensForExactTokens', outputs: [{ internalType: 'uint256[]', name: 'amounts', type: 'uint256[]' }], stateMutability: 'nonpayable', type: 'function' }, { stateMutability: 'payable', type: 'receive' }]

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

  const getPancakeRouterContract = (
    signer?: ethers.Signer | ethers.providers.Provider
  ) => {
    return getContract(routerAbi, '0x10ed43c718714eb63d5aa57b78b54704e256024e', signer)
  }
  return {
    getPancakeRouterContract,
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
