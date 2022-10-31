// import { useDispatch, useSelector } from 'react-redux'
// import { State } from '../../types'
import { useContract } from '../../../hooks/useContract'
import { bn } from '../../../utils/helpers'
import { setCurrentPoolInfo } from '../reducer'
import { useDispatch, useSelector } from 'react-redux'
import { State } from '../../types'
import { useWeb3React } from '../../customWeb3React/hook'
import { useWalletBalance } from '../../wallet/hooks/useBalances'
import { BalancesType } from '../../wallet/type'
import { useListTokens } from '../../token/hook'

export const useCurrentPool = () => {
  const { getTokenFactoryContract, getLogicContract, getPoolContract } = useContract()
  const { account } = useWeb3React()
  const { addTokens } = useListTokens()
  const dispatch = useDispatch()

  const {
    cToken,
    logicAddress,
    dTokens,
    powers,
    states
  } = useSelector((state: State) => {
    return {
      cToken: state.currentPool.cToken,
      logicAddress: state.currentPool.logicAddress,
      dTokens: state.currentPool.dTokens,
      powers: state.currentPool.powers,
      states: state.currentPool.states
    }
  })

  const updateCurrentPool = async (poolAddress: string) => {
    const poolFactoryContract = getTokenFactoryContract()
    const poolContract = getPoolContract(poolAddress)
    const logicAddress = await poolContract.LOGIC()
    const logicContract = getLogicContract(logicAddress)
    console.log(account, logicContract)

    // const state = await logicContract.TOKEN_2()
    const states = {
      baseTWAP: bn('10384592715470340267662384400637883679'),
      priceScaleLong: bn('7788445287819172527008699396495269118'),
      priceScaleShort: bn('7788445287819172527008699396495269118')
    }
    const cToken = await poolContract.COLLATERAL_TOKEN()
    const dTokens = await Promise.all([
      poolFactoryContract.computeTokenAddress(logicAddress, 0),
      poolFactoryContract.computeTokenAddress(logicAddress, 1),
      poolFactoryContract.computeTokenAddress(logicAddress, 2),
      poolFactoryContract.computeTokenAddress(logicAddress, 3)
    ])

    addTokens([...dTokens, cToken])

    dispatch(setCurrentPoolInfo({
      cToken,
      logicAddress,
      dTokens,
      powers: [-32, -4, 4, 32],
      states
    }))
  }
  /*

    x2: 1
    x8: 3

   */
  // const detectLeverage = (balances, dTokens, powers) => {
  //   let result = bn(0)
  //   for (const i in dTokens) {
  //     result = result.add(balances[dTokens[i]].mul(powers[i]))
  //   }
  // }

  return {
    updateCurrentPool,
    powers,
    cToken,
    logicAddress,
    dTokens,
    states
  }
}
