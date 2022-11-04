import { useCurrentPool } from '../state/currentPool/hooks/useCurrentPool'
import { useWeb3React } from '../state/customWeb3React/hook'
import { useConfigs } from '../state/config/useConfigs'
import { useContract } from './useContract'
import { StepType } from '../utils/powerLib'
import { SwapStepType } from '../utils/type'

export const UseExposureAction = () => {
  const { getRouterContract } = useContract()
  const { configs } = useConfigs()
  const { library, account } = useWeb3React()
  const { getTokenByPower } = useCurrentPool()

  const calculateAmountOuts = async (steps: StepType[], callback: any) => {
    try {
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
    } catch (e) {
      // eslint-disable-next-line standard/no-callback-literal
      callback([])
    }
  }

  const formatSwapSteps = (steps: StepType[]): SwapStepType[] => {
    const stepsToSwap = []
    for (const i in steps) {
      const step = steps[i]
      const tokenIn = getTokenByPower(Number(step.tokenIn))
      const tokenOut = getTokenByPower(Number(step.tokenOut))
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

  return { calculateAmountOuts, updateLeverageAndSize }
}
