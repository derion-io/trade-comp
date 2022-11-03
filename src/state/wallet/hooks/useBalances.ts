import { useDispatch, useSelector } from 'react-redux'
import {
  updateBalanceAndAllowancesReduce
} from '../reducer'
import { AllowancesType, BalancesType } from '../type'
import { useWeb3React } from '../../customWeb3React/hook'
import { useContract } from '../../../hooks/useContract'
import { useConfigs } from '../../config/useConfigs'
import { ethers } from 'ethers'
import ERC20Abi from '../../../assets/abi/IERC20.json'
import { LARGE_VALUE } from '../../../utils/constant'
import { toast } from 'react-toastify'
import { bn, parseCallStaticError } from '../../../utils/helpers'
import { messageAndViewOnBsc } from '../../../Components/MessageAndViewOnBsc'

export const useWalletBalance = () => {
  const { balances, accFetchBalance, routerAllowances } = useSelector((state: any) => {
    return {
      balances: state.wallet.balances,
      routerAllowances: state.wallet.routerAllowances,
      accFetchBalance: state.wallet.accFetchBalance
    }
  })
  const { configs } = useConfigs()
  const { library, account } = useWeb3React()
  const { getBnAContract } = useContract()

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
  }: {tokenAddress: string}) => {
    if (account && library) {
      try {
        const signer = library.getSigner()
        const contract = new ethers.Contract(tokenAddress, ERC20Abi, signer)
        const txRes = await contract.approve(configs.addresses.router, LARGE_VALUE)
        await txRes.wait(1)
        updateBalanceAndAllowances({ balances: {}, routerAllowances: { [tokenAddress]: bn(LARGE_VALUE) } })
        toast.success(
          messageAndViewOnBsc({
            title: 'Approve success',
            hash: txRes.hash
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
    if (account) {
      const bnAContract = getBnAContract()
      const newBalances: BalancesType = {}
      const routerAllowance = {}
      const r = await bnAContract.getBnA(tokensArr, [account], [configs.addresses.router])
      const res = r[0]
      for (let i = 0; i < tokensArr.length; i++) {
        const address = tokensArr[i]
        if (res[i * 2].gt(0)) {
          newBalances[address] = res[i * 2]
        }
        if (res[i * 2 + 1].gt(0)) {
          routerAllowance[address] = res[i * 2 + 1]
        }
      }
      updateBalanceAndAllowances({
        balances: newBalances,
        routerAllowances: routerAllowance
      })
    }
  }

  return {
    accFetchBalance,
    routerAllowances,
    balances,
    fetchBalanceAndAllowance,
    approveRouter
  }
}
