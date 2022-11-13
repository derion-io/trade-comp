import { useContract } from '../../../hooks/useContract'
import { setCurrentPoolInfo } from '../reducer'
import { useDispatch, useSelector } from 'react-redux'
import { State } from '../../types'
import { useWeb3React } from '../../customWeb3React/hook'
import { useListTokens } from '../../token/hook'
import { bn, div, formatPercent, numberToWei, sub, weiToNumber } from '../../../utils/helpers'
import { usePairInfo } from '../../../hooks/usePairInfo'
import { useConfigs } from '../../config/useConfigs'

const CHART_API_ENDPOINT = 'https://api.lz.finance/56/chart/'
const LP_PRICE_UNIT = 10000

export const useCurrentPool = () => {
  const { getPoolContract, getRouterContract } = useContract()
  const { getTokens } = useListTokens()
  const { getPairInfo } = usePairInfo()
  const { configs } = useConfigs()

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
    changedIn24h,
    poolAddress
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
      changedIn24h: state.currentPool.changedIn24h,
      poolAddress: state.currentPool.poolAddress
    }
  })

  const updateCurrentPool = async (poolAddress: string) => {
    const poolContract = getPoolContract(poolAddress)
    const logicAddress = await poolContract.LOGIC()
    const routerContract = getRouterContract()

    const routerStates = await routerContract.getStates(logicAddress)
    const states = {
      ...routerStates,
      twapBase: routerStates.twap.base._x,
      twapLP: routerStates.twap.LP._x,
      spotBse: routerStates.spot.base._x,
      spotLP: routerStates.spot.LP._x
    }
    const { baseToken, quoteToken, tokenC: cToken } = configs.addresses

    const [pairInfo, changedIn24h] = await Promise.all([
      getPairInfo(cToken),
      get24hChange(baseToken, cToken, quoteToken)
    ])
    const cPrice = bn(states.twapLP).mul(LP_PRICE_UNIT).shr(112).toNumber() / LP_PRICE_UNIT
    const basePrice = getBasePrice(pairInfo, baseToken)

    // const dTokens = await Promise.all([
    //   poolFactoryContract.computeTokenAddress(logicAddress, 0),
    //   poolFactoryContract.computeTokenAddress(logicAddress, 1),
    //   poolFactoryContract.computeTokenAddress(logicAddress, 2),
    //   poolFactoryContract.computeTokenAddress(logicAddress, 3)
    // ])
    const dTokens = [
      configs.addresses.dToken1,
      configs.addresses.dToken2,
      configs.addresses.dToken3,
      configs.addresses.dToken4
    ]

    const tokens = await getTokens([...dTokens, cToken, baseToken, quoteToken, poolAddress])

    return {
      tokens,
      cTokenPrice: cPrice,
      basePrice,
      cToken,
      logicAddress,
      dTokens,
      powers: configs.powers,
      states,
      baseToken,
      quoteToken,
      changedIn24h,
      poolAddress
    }
  }

  // const getLpPrice = (lpTokenDetail: any, baseToken: string) => {
  //   const totalSupply = lpTokenDetail.totalSupply
  //   const r0 = lpTokenDetail.token0.reserve
  //   const r1 = lpTokenDetail.token1.reserve
  //   const rq = lpTokenDetail.token0.address === baseToken ? r1 : r0
  //   return weiToNumber(bn(2).mul(rq).mul(numberToWei(1)).div(totalSupply))
  // }

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
    states,
    poolAddress
  }
}
