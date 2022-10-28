// import { useDispatch, useSelector } from 'react-redux'
// import { State } from '../../types'
import { useContract } from '../../../hooks/useContract'

export const useCurrentPool = () => {
  const { getTokenFactoryContract, getLogicContract, getPoolContract } = useContract()
  // const dispatch = useDispatch()
  // const {} = useSelector((state: State) => {
  //   return {
  //
  //   }
  // })

  const updateCurrentPool = async (poolAddress: string) => {
    const poolFactoryContract = getTokenFactoryContract()
    const poolContract = getPoolContract(poolAddress)
    const logicAddress = await poolContract.LOGIC()
    const logicContract = getLogicContract(logicAddress)
    console.log(logicContract)

    const state = await logicContract.TOKEN_2()
    const cToken = await poolContract.COLLATERAL_TOKEN()
    const dtokens = await Promise.all([
      poolFactoryContract.computeTokenAddress(logicAddress, 0),
      poolFactoryContract.computeTokenAddress(logicAddress, 1),
      poolFactoryContract.computeTokenAddress(logicAddress, 2),
      poolFactoryContract.computeTokenAddress(logicAddress, 3)
    ])

    console.log({
      cToken,
      logicAddress,
      dtokens,
      state
    })
  }

  return {
    updateCurrentPool
  }
}
