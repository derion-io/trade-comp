import { useDispatch, useSelector } from 'react-redux'
import {
  updateBalanceAndAllowancesReduce
} from '../reducer'
import { AllowancesType, BalancesType } from '../type'
import { useWeb3React } from '../../customWeb3React/hook'
import { useConfigs } from '../../config/useConfigs'
import { ethers } from 'ethers'
import ERC20Abi from '../../../assets/abi/IERC20.json'
import { LARGE_VALUE, POOL_IDS } from '../../../utils/constant'
import { toast } from 'react-toastify'
import {
  bn,
  decodeErc1155Address,
  isErc1155Address,
  parseCallStaticError
} from '../../../utils/helpers'
import { messageAndViewOnBsc } from '../../../Components/MessageAndViewOnBsc'
import { useContract } from '../../../hooks/useContract'
import { useCurrentPool } from '../../currentPool/hooks/useCurrentPool'

export const useWalletBalance = () => {
  const { getPoolContract } = useContract()
  const { powers, poolAddress } = useCurrentPool()
  const { balances, accFetchBalance, routerAllowances } = useSelector((state: any) => {
    return {
      balances: state.wallet.balances,
      routerAllowances: state.wallet.routerAllowances,
      accFetchBalance: state.wallet.accFetchBalance
    }
  })
  const { configs, chainId, ddlEngine } = useConfigs()
  const { library, account } = useWeb3React()

  const dispatch = useDispatch()

  const updateBalanceAndAllowances = ({
    balances,
    routerAllowances
  }: {
    balances: BalancesType,
    routerAllowances: AllowancesType
  }) => {
    dispatch(
      updateBalanceAndAllowancesReduce({
        account,
        balances,
        routerAllowances
      })
    )
  }

  const approveRouter = async ({
    tokenAddress
  }: { tokenAddress: string }) => {
    if (account && library) {
      try {
        const signer = library.getSigner()
        let hash = ''
        if (tokenAddress === poolAddress || isErc1155Address(tokenAddress)) {
          const poolAddress = decodeErc1155Address(tokenAddress).address
          const contract = getPoolContract(poolAddress, signer)
          const txRes = await contract.setApprovalForAll(configs.addresses.router, true)
          await txRes.wait(1)
          hash = txRes.hash

          const routerAllowances = {
            [tokenAddress]: bn(LARGE_VALUE),
            [tokenAddress + '-' + POOL_IDS.cp]: bn(LARGE_VALUE)
          }
          powers.forEach((power, key) => {
            routerAllowances[poolAddress + '-' + key] = bn(LARGE_VALUE)
          })

          updateBalanceAndAllowances({
            balances: {},
            routerAllowances
          })
        } else {
          const contract = new ethers.Contract(tokenAddress, ERC20Abi, signer)
          const txRes = await contract.approve(configs.addresses.router, LARGE_VALUE)
          await txRes.wait(1)
          hash = txRes.hash
          updateBalanceAndAllowances({ balances: {}, routerAllowances: { [tokenAddress]: bn(LARGE_VALUE) } })
        }
        toast.success(
          messageAndViewOnBsc({
            title: 'Approve success',
            hash
          })
        )
      } catch (e) {
        toast.error(parseCallStaticError(e))
      }
    } else {
      toast.error('Please connect the wallet')
    }
  }

  const fetchBalanceAndAllowance = async (tokensArr: string[]) => {
    if (!ddlEngine) return
    const { balances, allowances } = await ddlEngine.BNA.getBalanceAndAllowance({
      account,
      tokens: tokensArr,
      rpcUrl: configs.rpcUrl,
      chainId: chainId
    })
    updateBalanceAndAllowances({
      balances,
      routerAllowances: {
        ...allowances,
        [configs.addresses.nativeToken]: bn(LARGE_VALUE)
      }
    })
  }

  return {
    accFetchBalance,
    routerAllowances,
    balances,
    fetchBalanceAndAllowance,
    approveRouter
  }
}
