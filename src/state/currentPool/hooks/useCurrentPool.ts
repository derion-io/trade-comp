import { useContract } from '../../../hooks/useContract'
import { useSelector } from 'react-redux'
import { State } from '../../types'
import { useListTokens } from '../../token/hook'
import { bn, div, formatPercent, numberToWei, sub, weiToNumber } from '../../../utils/helpers'
import { usePairInfo } from '../../../hooks/usePairInfo'
import { useConfigs } from '../../config/useConfigs'
import { useListPool } from '../../pools/hooks/useListPool'

const CHART_API_ENDPOINT = 'https://api.lz.finance/56/chart/'
const LP_PRICE_UNIT = 10000

export const useCurrentPool = () => {
  const { getPairInfo } = usePairInfo()
  const { pools } = useListPool()

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
    const pool = pools[poolAddress]
    const { logic, states, dTokens, baseToken, cToken } = pool
    const pairInfo = await getPairInfo(pool.cToken)
    const quoteToken = pairInfo.token0.adr === baseToken ? pairInfo.token1.adr : pairInfo.token0.adr
    const tokens = [
      {
        address: pairInfo.token0.adr,
        decimal: pairInfo.token0.decimal,
        name: pairInfo.token0.name,
        symbol: pairInfo.token0.symbol,
        totalSupply: pairInfo.token0.totalSupply
      },
      {
        address: pairInfo.token1.adr,
        decimal: pairInfo.token1.decimal,
        name: pairInfo.token1.name,
        symbol: pairInfo.token1.symbol,
        totalSupply: pairInfo.token1.totalSupply
      }
    ]

    const changedIn24h = await get24hChange(baseToken, cToken, quoteToken)
    const cPrice = bn(states.twapLP).mul(LP_PRICE_UNIT).shr(112).toNumber() / LP_PRICE_UNIT
    const basePrice = getBasePrice(pairInfo, baseToken)

    return {
      tokens,
      cTokenPrice: cPrice,
      basePrice,
      cToken,
      logicAddress: logic,
      dTokens,
      powers,
      states,
      baseToken,
      quoteToken,
      changedIn24h,
      poolAddress
    }
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
    states,
    poolAddress
  }
}
