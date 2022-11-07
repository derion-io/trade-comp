import { useCurrentPool } from '../state/currentPool/hooks/useCurrentPool'
import { useWeb3React } from '../state/customWeb3React/hook'
import { useConfigs } from '../state/config/useConfigs'
import { useContract } from './useContract'
import { StepType } from '../utils/powerLib'
import { SwapStepType } from '../utils/type'
import { ZERO_ADDRESS } from '../utils/constant'
import { bn } from '../utils/helpers'

export const UseExposureAction = () => {
  const { getRouterContract } = useContract()
  const { configs } = useConfigs()
  const { library, account } = useWeb3React()
  const { getTokenByPower } = useCurrentPool()

  const deleverage = async () => {
    const signer = library.getSigner()
    const contract = getRouterContract(signer)
    try {
      await contract.callStatic.multiSwap(
        configs.addresses.pool,
        [{
          tokenIn: ZERO_ADDRESS,
          tokenOut: ZERO_ADDRESS,
          amountIn: bn(0),
          amountOutMin: 0
        }],
        account,
        new Date().getTime() + 3600000
      )
      await contract.multiSwap(
        configs.addresses.pool,
        [{
          tokenIn: ZERO_ADDRESS,
          tokenOut: ZERO_ADDRESS,
          amountIn: bn(0),
          amountOutMin: 0
        }],
        account,
        new Date().getTime() + 3600000
      )
    } catch (e) {
      console.log(e)
    }
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
      new Date().getTime() + 3600000
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

  const multiSwap = async (steps: SwapStepType[]) => {
    try {
      const signer = library.getSigner()
      const contract = getRouterContract(signer)
      const tx = await contract.multiSwap(
        configs.addresses.pool,
        steps,
        account,
        new Date().getTime() + 3600000
      )
      await tx.wait(1)
      return tx
    } catch (e) {
      console.error(e)
      return null
    }
  }

  const updateLeverageAndSize = async (rawStep: StepType[]) => {
    try {
      const steps = formatSwapSteps(rawStep)
      return await multiSwap(steps)
    } catch (e) {
      console.error(e)
      return e
    }
  }

  return { deleverage, calculateAmountOuts, updateLeverageAndSize }
}
