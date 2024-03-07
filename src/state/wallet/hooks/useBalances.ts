import { useDispatch, useSelector } from 'react-redux'
import { updateBalanceAndAllowancesReduce } from '../reducer'
import { AllowancesType, BalancesType, MaturitiesType, initialAccountState, walletState } from '../type'
import { useWeb3React } from '../../customWeb3React/hook'
import { useConfigs } from '../../config/useConfigs'
import { ethers } from 'ethers'
import ERC20Abi from '../../../assets/abi/IERC20.json'
import { LARGE_VALUE, NATIVE_ADDRESS, POOL_IDS } from '../../../utils/constant'
import { toast } from 'react-toastify'
import {
  bn,
  decodeErc1155Address,
  isErc1155Address,
  parseCallStaticError
} from '../../../utils/helpers'
import { messageAndViewOnBsc } from '../../../Components/MessageAndViewOnBsc'
import { useContract } from '../../../hooks/useContract'
import { useCurrentPoolGroup } from '../../currentPool/hooks/useCurrentPoolGroup'
import { useMemo } from 'react'

export const useWalletBalance = () => {
  const { getPoolContract } = useContract()
  const { powers } = useCurrentPoolGroup()
  const { provider, account } = useWeb3React()
  const mapAccounts =
    useSelector((state: {wallet: walletState}) => {
      return state.wallet.mapAccounts
    })
  const { configs, ddlEngine } = useConfigs()

  const wallet = useMemo(() => {
    let accountData = mapAccounts[account]
    if (!accountData?.balances) { accountData = initialAccountState }
    return {
      ...accountData,
      accFetchBalance: account
    }
  }, [account, mapAccounts])

  const dispatch = useDispatch()

  const updateBalanceAndAllowances = ({
    balances,
    routerAllowances,
    maturities
  }: {
    balances: BalancesType
    routerAllowances: AllowancesType
    maturities: MaturitiesType
  }) => {
    dispatch(
      updateBalanceAndAllowancesReduce({
        account,
        balances,
        maturities,
        routerAllowances
      })
    )
  }

  const approveRouter = async ({ tokenAddress }: { tokenAddress: string }) => {
    if (account && provider) {
      try {
        const signer = provider.getSigner()
        let hash = ''
        if (isErc1155Address(tokenAddress)) {
          const poolAddress = decodeErc1155Address(tokenAddress).address
          const contract = getPoolContract(poolAddress, signer)
          const txRes = await contract.setApprovalForAll(
            configs.helperContract.utr,
            true
          )
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
            maturities: {},
            routerAllowances
          })
        } else {
          const contract = new ethers.Contract(tokenAddress, ERC20Abi, signer)
          const txRes = await contract.approve(
            configs.helperContract.utr,
            LARGE_VALUE
          )
          await txRes.wait(1)
          hash = txRes.hash
          updateBalanceAndAllowances({
            balances: {},
            maturities: {},
            routerAllowances: { [tokenAddress]: bn(LARGE_VALUE) }
          })
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

  const fetchBalanceAndAllowance = async (withNative: boolean = true) => {
    if (!ddlEngine) return
    const {
      balances,
      allowances,
      maturity: maturities
    } = await ddlEngine.BNA.getBalanceAndAllowance(withNative ? [NATIVE_ADDRESS] : [])
    updateBalanceAndAllowances({
      balances,
      maturities,
      routerAllowances: {
        ...allowances,
        [NATIVE_ADDRESS]: bn(LARGE_VALUE)
      }
    })
  }

  return {
    ...wallet,
    fetchBalanceAndAllowance,
    approveRouter,
    updateBalanceAndAllowances
  }
}
