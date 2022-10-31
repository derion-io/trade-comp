import { useDispatch, useSelector } from 'react-redux'
import {
  updateBalanceAndAllowancesReduce
} from '../reducer'
import { AllowancesType, BalancesType } from '../type'
import { useWeb3React } from '../../customWeb3React/hook'
import { useContract } from '../../../hooks/useContract'
import { useConfigs } from '../../config/useConfigs'

export const useWalletBalance = () => {
  const { balances, accFetchBalance, routerAllowances } = useSelector((state: any) => {
    return {
      balances: state.wallet.balances,
      routerAllowances: state.wallet.routerAllowances,
      accFetchBalance: state.wallet.accFetchBalance
    }
  })
  const { configs } = useConfigs()
  const { account } = useWeb3React()
  const { getBnAContract } = useContract()

  const dispatch = useDispatch()

  const updateBalanceAndAllowances = async ({
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
  }
}
