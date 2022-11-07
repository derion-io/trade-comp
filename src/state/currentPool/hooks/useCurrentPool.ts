import { useContract } from '../../../hooks/useContract'
import { setCurrentPoolInfo } from '../reducer'
import { useDispatch, useSelector } from 'react-redux'
import { State } from '../../types'
import { useWeb3React } from '../../customWeb3React/hook'
import { useListTokens } from '../../token/hook'
import { bn, div, formatPercent, numberToWei, sub, weiToNumber } from '../../../utils/helpers'
import { usePairInfo } from '../../../hooks/usePairInfo'

const CHART_API_ENDPOINT = 'https://api.lz.finance/56/chart/'

export const useCurrentPool = () => {
  const { getTokenFactoryContract, getLogicContract, getPoolContract } = useContract()
  const { account } = useWeb3React()
  const { addTokens } = useListTokens()
  const { getPairInfo } = usePairInfo()
  const dispatch = useDispatch()

  const {
    cTokenPrice,
    cToken,
    logicAddress,
    dTokens,
    powers,
    states,
    baseToken,
    quoteToken,
    basePrice,
    changedIn24h
  } = useSelector((state: State) => {
    return {
      cTokenPrice: state.currentPool.cTokenPrice,
      cToken: state.currentPool.cToken,
      logicAddress: state.currentPool.logicAddress,
      dTokens: state.currentPool.dTokens,
      powers: state.currentPool.powers,
      states: state.currentPool.states,
      baseToken: state.currentPool.baseToken,
      quoteToken: state.currentPool.quoteToken,
      basePrice: state.currentPool.basePrice,
      changedIn24h: state.currentPool.changedIn24h
    }
  })

  const updateCurrentPool = async (poolAddress: string) => {
    const poolFactoryContract = getTokenFactoryContract()
    const poolContract = getPoolContract(poolAddress)
    const logicAddress = await poolContract.LOGIC()
    const logicContract = getLogicContract(logicAddress)

    const states = await logicContract.getStates()
    const cToken = await poolContract.COLLATERAL_TOKEN()
    const [baseToken, quoteToken] = ['0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56']

    const [pairInfo, changedIn24h] = await Promise.all([
      getPairInfo(cToken),
      get24hChange(baseToken, cToken, quoteToken)
    ])
    const cPrice = getLpPrice(pairInfo, baseToken)
    const basePrice = getBasePrice(pairInfo, baseToken)

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

    addTokens([...dTokens, cToken, baseToken, quoteToken])

    dispatch(setCurrentPoolInfo({
      cTokenPrice: cPrice,
      basePrice,
      cToken,
      logicAddress,
      dTokens,
      powers: [-32, -4, 4, 32],
      states,
      baseToken,
      quoteToken,
      changedIn24h
    }))
  }

  const getLpPrice = (lpTokenDetail: any, baseToken: string) => {
    const totalSupply = lpTokenDetail.totalSupply
    const r0 = lpTokenDetail.token0.reserve
    const r1 = lpTokenDetail.token1.reserve
    const rq = lpTokenDetail.token0.address === baseToken ? r1 : r0
    return weiToNumber(bn(2).mul(rq).mul(numberToWei(1)).div(totalSupply))
  }

  const getBasePrice = (pairInfo: any, baseToken: string) => {
    const token0 = pairInfo.token0.adr
    const r0 = pairInfo.token0.reserve
    const r1 = pairInfo.token1.reserve
    const [rb, rq] = token0 === baseToken ? [r0, r1] : [r1, r0]
    return weiToNumber(rq.mul(numberToWei(1)).div(rb))
  }

  const getTokenByPower = (power: number | string) => {
    if (power === 'C') {
      return cToken
    }
    const index = powers.findIndex((p) => p === Number(power))
    return dTokens[index]
  }

  const get24hChange = async (baseToken: string, cToken:string, quoteToken: string) => {
    const toTime = Math.floor(new Date().getTime() / 1000)
    const query = `${baseToken},${cToken},${quoteToken}`
    const result = await fetch(`${CHART_API_ENDPOINT}candleline4?q=${query}&r=1H&l=24&t=${toTime}`)
      .then((r) => r.json())
      .then((res: any) => {
        const open = res.o[0]
        const close = res.c[res.o?.length - 1]
        console.log({
          open, close
        })
        return formatPercent(
          div(
            sub(close, open),
            open
          )
        )
      })
      .catch((err: any) => {
        console.error(err)
        return 0
      })

    return Number(result)
  }

  return {
    getTokenByPower,
    updateCurrentPool,
    basePrice,
    changedIn24h,
    cTokenPrice,
    baseToken,
    quoteToken,
    powers,
    cToken,
    logicAddress,
    dTokens,
    states
  }
}
