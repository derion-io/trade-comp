import { useContract } from '../../../hooks/useContract'
import { setCurrentPoolInfo } from '../reducer'
import { useDispatch, useSelector } from 'react-redux'
import { State } from '../../types'
import { useWeb3React } from '../../customWeb3React/hook'
import { useListTokens } from '../../token/hook'
import { bn } from '../../../utils/helpers'

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
    states,
    baseToken,
    quoteToken
  } = useSelector((state: State) => {
    return {
      cToken: state.currentPool.cToken,
      logicAddress: state.currentPool.logicAddress,
      dTokens: state.currentPool.dTokens,
      powers: state.currentPool.powers,
      states: state.currentPool.states,
      baseToken: state.currentPool.baseToken,
      quoteToken: state.currentPool.quoteToken
    }
  })

  const updateCurrentPool = async (poolAddress: string) => {
    const poolFactoryContract = getTokenFactoryContract()
    const poolContract = getPoolContract(poolAddress)
    const logicAddress = await poolContract.LOGIC()
    const logicContract = getLogicContract(logicAddress)

    const states = await logicContract.getStates()
    console.log('stats', states)
    // const states = {
    //   baseTWAP: bn('10384592715470340267662384400637883679'),
    //   priceScaleLong: bn('7788445287819172527008699396495269118'),
    //   priceScaleShort: bn('7788445287819172527008699396495269118')
    // }
    const cToken = await poolContract.COLLATERAL_TOKEN()
    console.log(cToken)
    const [baseToken, quoteToken] = ['0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56']
    // const dTokens = await Promise.all([
    //   poolFactoryContract.computeTokenAddress(logicAddress, 0),
    //   poolFactoryContract.computeTokenAddress(logicAddress, 1),
    //   poolFactoryContract.computeTokenAddress(logicAddress, 2),
    //   poolFactoryContract.computeTokenAddress(logicAddress, 3)
    // ])
    const dTokens = [
      '0xcD70A9269907f69870264a94CDb834cF6dAfb8b8',
      '0xfC4a7B7Bb09bD5C950E1d0D5c3266CA285b5ba7b',
      '0xFFE34937F4486DdEa901e332f720523ddb307d37',
      '0xbbDF7765d0Fe3DCe6CA07664505662e3D772Cd8B'
    ]
    console.log(cToken)

    addTokens([...dTokens, cToken, baseToken, quoteToken])

    dispatch(setCurrentPoolInfo({
      cToken,
      logicAddress,
      dTokens,
      powers: [-32, -4, 4, 32],
      states,
      baseToken,
      quoteToken
    }))
  }

  const getTokenByPower = (power: number | string) => {
    if (power === 'C') {
      return cToken
    }
    const index = powers.findIndex((p) => p === power)
    return dTokens[index]
  }

  return {
    getTokenByPower,
    updateCurrentPool,
    baseToken,
    quoteToken,
    powers,
    cToken,
    logicAddress,
    dTokens,
    states
  }
}
