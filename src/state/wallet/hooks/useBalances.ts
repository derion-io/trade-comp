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
  getErc1155Token,
  getNormalAddress, isErc1155Address,
  parseCallStaticError
} from '../../../utils/helpers'
import { messageAndViewOnBsc } from '../../../Components/MessageAndViewOnBsc'
import BnAAbi from '../../../assets/abi/BnA.json'
import { Multicall } from 'ethereum-multicall'
import { JsonRpcProvider } from '@ethersproject/providers'
import PoolAbi from '../../../assets/abi/Pool.json'
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
  const { configs } = useConfigs()
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
        if (tokenAddress == poolAddress || isErc1155Address(tokenAddress)) {
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
    if (account) {
      const provider = new JsonRpcProvider(configs.rpcUrl)
      const multicall = new Multicall({
        multicallCustomContractAddress: configs.addresses.multiCall,
        ethersProvider: provider,
        tryAggregate: true
      })
      const erc20Tokens = getNormalAddress(tokensArr)
      const erc1155Tokens = getErc1155Token(tokensArr)
      const multiCallRequest = getBnAMulticallRequest(erc20Tokens, erc1155Tokens)
      const { results } = await multicall.call(multiCallRequest)
      const { balances, allowances } = parseBnAMultiRes(erc20Tokens, erc1155Tokens, results)

      updateBalanceAndAllowances({
        balances,
        routerAllowances: allowances
      })
    }
  }

  const parseBnAMultiRes = (erc20Address: any, erc1155Tokens: any, data: any) => {
    const balances = {}
    const allowances = {}
    const erc20Info = data.erc20.callsReturnContext[0].returnValues[0]
    console.log({
      erc20Address,
      erc20Info
    })
    const erc1155Info = data.erc1155.callsReturnContext
    for (let i = 0; i < erc20Address.length; i++) {
      const address = erc20Address[i]
      balances[address] = bn(erc20Info[i * 2])
      allowances[address] = bn(erc20Info[i * 2 + 1])
    }

    const approveData = erc1155Info.filter((e: any) => e.methodName === 'isApprovedForAll')
    const balanceData = erc1155Info.filter((e: any) => e.methodName === 'balanceOfBatch')

    for (let i = 0; i < approveData.length; i++) {
      const callsReturnContext = approveData[i]
      allowances[callsReturnContext.reference] = callsReturnContext.returnValues[0] ? bn(LARGE_VALUE) : bn(0)
    }

    for (let i = 0; i < balanceData.length; i++) {
      const returnValues = balanceData[i].returnValues
      for (let j = 0; j < returnValues.length; j++) {
        const id = erc1155Tokens[balanceData[i].reference][j].toNumber()
        balances[balanceData[i].reference + '-' + id] = bn(returnValues[j])
      }
    }

    return {
      balances,
      allowances
    }
  }

  const getBnAMulticallRequest = (erc20Tokens: string[], erc1155Tokens: { [key: string]: string[] }) => {
    const request: any = [
      {
        reference: 'erc20',
        contractAddress: configs.addresses.bnA,
        abi: BnAAbi,
        calls: [{ reference: 'bna', methodName: 'getBnA', methodParameters: [erc20Tokens, [account], [configs.addresses.router]] }]
      }
    ]

    for (const erc1155Address in erc1155Tokens) {
      const accounts = erc1155Tokens[erc1155Address].map(() => {
        return account
      })
      request.push(
        {
          reference: 'erc1155',
          contractAddress: erc1155Address,
          abi: PoolAbi,
          calls: [
            { reference: erc1155Address, methodName: 'isApprovedForAll', methodParameters: [account, configs.addresses.router] },
            { reference: erc1155Address, methodName: 'balanceOfBatch', methodParameters: [accounts, erc1155Tokens[erc1155Address]] }
          ]
        }
      )
    }

    return request
  }

  return {
    accFetchBalance,
    routerAllowances,
    balances,
    fetchBalanceAndAllowance,
    approveRouter
  }
}
