import { useSelector } from 'react-redux'
import { State } from '../../types'
import { bn, div, formatPercent, numberToWei, sub, weiToNumber } from '../../../utils/helpers'
import { usePairInfo } from '../../../hooks/usePairInfo'
import { useListPool } from '../../pools/hooks/useListPool'
import { POOL_IDS } from '../../../utils/constant'

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
    baseId,
    quoteId,
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
      baseId: state.currentPool.baseId,
      quoteId: state.currentPool.quoteId,
      changedIn24h: state.currentPool.changedIn24h,
      poolAddress: state.currentPool.poolAddress
    }
  })

  const updateCurrentPool = async (poolAddress: string) => {
    const pool = pools[poolAddress]
    const { cPrice, baseId, quoteId, logic, states, powers, dTokens, baseToken, cToken } = pool
    const changedIn24h = await get24hChange(baseToken, cToken, quoteToken)

    return {
      cTokenPrice: cPrice,
      basePrice,
      cToken,
      logicAddress: logic,
      baseId,
      quoteId,
      dTokens,
      powers,
      states,
      baseToken,
      quoteToken,
      changedIn24h,
      poolAddress
    }
  }

  const getTokenByPower = (power: number | string) => {
    if (power === 'C') {
      return cToken
    }
    const index = powers.findIndex((p) => p === Number(power))
    return dTokens[index]
  }

  const get24hChange = async (baseToken: string, cToken: string, quoteToken: string) => {
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
    baseId,
    quoteId,
    logicAddress,
    dTokens,
    states,
    poolAddress
  }
}
