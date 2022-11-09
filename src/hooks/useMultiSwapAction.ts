import { useCurrentPool } from '../state/currentPool/hooks/useCurrentPool'
import { useWeb3React } from '../state/customWeb3React/hook'
import { useConfigs } from '../state/config/useConfigs'
import { useContract } from './useContract'
import { StepType } from '../utils/powerLib'
import { SwapStepType } from '../utils/type'
import { ZERO_ADDRESS } from '../utils/constant'
import { bn, parseCallStaticError } from '../utils/helpers'
import { toast } from 'react-toastify'

// TODO: don't hardcode these
const fee10000 = 30

const DELEVERAGE_STEP: SwapStepType = {
  tokenIn: ZERO_ADDRESS,
  tokenOut: ZERO_ADDRESS,
  amountIn: bn(0),
  amountOutMin: bn(0)
}

export const useMultiSwapAction = () => {
  const { getRouterContract } = useContract()
  const { configs } = useConfigs()
  const { library, account } = useWeb3React()
  const { getTokenByPower, baseToken, quoteToken } = useCurrentPool()

  const getFee10000 = (steps: any[]) => {
    return steps.some(step => [baseToken, quoteToken].includes(step.tokenIn)) ? fee10000 : 0
  }

  const calculateAmountOuts = async (steps: StepType[], callback: any) => {
    if (!library) return
    const signer = library.getSigner()
    const contract = getRouterContract(signer)
    const stepsToSwap = formatSwapSteps(steps)
    const res = await contract.callStatic.multiSwap(
      configs.addresses.pool,
      stepsToSwap,
      account,
      new Date().getTime() + 3600000,
      getFee10000(stepsToSwap),
    )

    const result = []
    for (const i in steps) {
      result.push({ ...steps[i], amountOut: res[0][i] })
    }

    callback(result)
  }

  const formatSwapSteps = (steps: StepType[]): SwapStepType[] => {
    const stepsToSwap = []
    for (const i in steps) {
      const step = steps[i]
      const tokenIn = getTokenByPower(step.tokenIn)
      const tokenOut = getTokenByPower(step.tokenOut)
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

  const checkMultiSwapError = async (steps: SwapStepType[]) => {
    try {
      const signer = library.getSigner()
      const contract = getRouterContract(signer)
      await contract.callStatic.multiSwap(
        configs.addresses.pool,
        steps,
        account,
        new Date().getTime() + 3600000,
        getFee10000(steps),
      )
      return null
    } catch (e) {
      return parseCallStaticError(e)
    }
  }

  const multiSwap = async (steps: SwapStepType[], isDeleverage = false) => {
    try {
      const stepsToSwap = [...steps]
      if (isDeleverage) {
        stepsToSwap.unshift(DELEVERAGE_STEP)
      }
      const error = await checkMultiSwapError(stepsToSwap)
      if (error) {
        toast.error(error)
      } else {
        const signer = library.getSigner()
        const contract = getRouterContract(signer)
        const tx = await contract.multiSwap(
          configs.addresses.pool,
          steps,
          account,
          new Date().getTime() + 3600000,
          getFee10000(steps),
        )
        await tx.wait(1)
        toast.error('Swap success')
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
