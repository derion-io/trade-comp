import { useCurrentPool } from '../state/currentPool/hooks/useCurrentPool'
import { useWeb3React } from '../state/customWeb3React/hook'
import { useConfigs } from '../state/config/useConfigs'
import { useContract } from './useContract'
import { StepType } from 'powerLib'
import { PoolErc1155StepType, SwapStepType } from '../utils/type'
import { POOL_IDS, ZERO_ADDRESS } from '../utils/constant'
import { bn, numberToWei, parseCallStaticError } from '../utils/helpers'
import { toast } from 'react-toastify'
import { BigNumber, ethers } from 'ethers'
import { useWalletBalance } from '../state/wallet/hooks/useBalances'
import { useListTokens } from '../state/token/hook'

// TODO: don't hardcode these
const fee10000 = 30

const DELEVERAGE_STEP = {
  idIn: bn(0),
  idOut: bn(0),
  amountIn: bn(0),
  amountOutMin: bn(0)
}

const gasLimit = 3000000

export const useMultiSwapAction = () => {
  const { getRouterContract } = useContract()
  const { library, account } = useWeb3React()
  const { configs } = useConfigs()
  const { getTokenByPower, baseToken, poolAddress, quoteToken, cToken, baseId, quoteId } = useCurrentPool()
  const { tokens } = useListTokens()
  const { fetchBalanceAndAllowance } = useWalletBalance()

  const calculateAmountOuts = async (steps: StepType[], isDeleverage: boolean = false) => {
    if (!library) return [[bn(0)], bn(0)]
    const signer = library.getSigner()
    const contract = getRouterContract(signer)
    const { stepsToSwap, value } = convertStepForPoolErc1155(formatSwapSteps(steps))
    if (isDeleverage) {
      stepsToSwap.unshift(DELEVERAGE_STEP)
    }

    console.log('params', [{
      pool: poolAddress,
      to: account,
      deadline: new Date().getTime() + 3600000,
      fee10000,
      referrer: ethers.utils.hexZeroPad('0x00', 32)
    },
    stepsToSwap,
    {
      gasLimit,
      value
    }])
    const res = await contract.callStatic.multiSwap(
      {
        pool: poolAddress,
        to: account,
        deadline: new Date().getTime() + 3600000,
        fee10000,
        referrer: ethers.utils.hexZeroPad('0x00', 32)
      },
      stepsToSwap,
      {
        gasLimit,
        value
      }
    )

    const result = []
    for (const i in steps) {
      result.push({ ...steps[i], amountOut: res[0][i] })
    }
    return [result, bn(gasLimit).sub(res.gasLeft)]
  }

  const formatSwapSteps = (steps: StepType[]): SwapStepType[] => {
    const stepsToSwap = []
    for (const i in steps) {
      const step = steps[i]
      const tokenIn = getTokenByPower(step.tokenIn) || step.tokenIn
      const tokenOut = getTokenByPower(step.tokenOut) || step.tokenOut
      if (step.amountIn.isZero() || !tokenIn || !tokenOut) {
        continue
      }
      stepsToSwap.push({
        tokenIn,
        tokenOut,
        amountIn: step.amountIn,
        amountOutMin: 0
      })
    }
    return stepsToSwap
  }

  const checkMultiSwapError = async (steps: PoolErc1155StepType[], value: BigNumber ) => {
    try {
      const signer = library.getSigner()
      const contract = getRouterContract(signer)
      await contract.callStatic.multiSwap(
        {
          pool: poolAddress,
          to: account,
          deadline: new Date().getTime() + 3600000,
          fee10000,
          referrer: ethers.utils.hexZeroPad('0x00', 32)
        },
        steps,
        {
          value
        }
      )
      return null
    } catch (e) {
      return parseCallStaticError(e)
    }
  }

  const convertStepForPoolErc1155 = (steps: SwapStepType[]): {stepsToSwap: PoolErc1155StepType[], value: BigNumber} => {
    let value = bn(0)
    steps.forEach((step) => {
      if (step.tokenIn === configs.addresses.nativeToken) {
        value = value.add(step.amountIn)
      }
    })

    const stepsToSwap = steps.map((step) => {
      return {
        idIn: getIdByAddress(step.tokenIn),
        idOut: getIdByAddress(step.tokenOut),
        amountIn: step.amountIn,
        amountOutMin: step.amountOutMin
      }
    })

    return { stepsToSwap, value }
  }
  const getIdByAddress = (address: string) => {
    try {
      if (address === baseToken) return bn(baseId)
      if (address === quoteToken) return bn(quoteId)
      if (address === configs.addresses.nativeToken) return POOL_IDS.native
      if (address === cToken) return bn(POOL_IDS.cToken)
      return bn(address.split('-')[1])
    } catch (e) {
      throw new Error('Token id not found')
    }
  }

  const multiSwap = async (steps: SwapStepType[], isDeleverage = false) => {
    try {
      const { stepsToSwap, value } = convertStepForPoolErc1155([...steps])
      if (isDeleverage) {
        stepsToSwap.unshift(DELEVERAGE_STEP)
      }
      const error = await checkMultiSwapError(stepsToSwap, value)
      if (error) {
        toast.error(error)
      } else {
        const signer = library.getSigner()
        const contract = getRouterContract(signer)
        console.log({
          stepsToSwap,
          pool: poolAddress,
          to: account,
          deadline: new Date().getTime() + 3600000,
          fee10000,
          referrer: ethers.utils.hexZeroPad('0x00', 32)
        })
        const tx = await contract.multiSwap(
          {
            pool: poolAddress,
            to: account,
            deadline: new Date().getTime() + 3600000,
            fee10000,
            referrer: ethers.utils.hexZeroPad('0x00', 32)
          },
          stepsToSwap,
          {
            value
          }
        )
        console.log('tx', tx)
        await tx.wait(1)
        toast.success('Swap success')
        fetchBalanceAndAllowance(Object.keys(tokens))
        return tx
      }
    } catch (e) {
      console.error(e)
      const error = parseCallStaticError(e)
      toast.error(error)
      return null
    }
  }

  const updateLeverageAndSize = async (rawStep: StepType[], isDeleverage = false) => {
    try {
      const steps = formatSwapSteps(rawStep)
      return await multiSwap(steps, isDeleverage)
    } catch (e) {
      console.error(e)
      return e
    }
  }

  return {
    multiSwap,
    calculateAmountOuts,
    updateLeverageAndSize
  }
}
