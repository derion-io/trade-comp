import { numberToWei, weiToNumber } from '../../utils/helpers'
import { store } from '../../state'
import { TokenType } from '../../state/token/type'
import { CHART_API_ENDPOINT } from '../../utils/constant'

const history = {}

const convertResolution = (oldResolution: string) => {
  if (oldResolution.includes('D')) {
    return oldResolution
  } else {
    if (Number(oldResolution) < 60) {
      return oldResolution
    } else {
      return Number(oldResolution) / 60 + 'H'
    }
  }
}

export const resolutionToPeriod = {
  5: '5m',
  15: '15m',
  60: '1h',
  240: '4h',
  '1D': '1d'
}

export type CandleType = {
  low: number
  open: number
  time: number
  close: number
  high: number
  volume: number
}

export type CandleFromApiType = {
  s: string
  t: number[]
  o: string[]
  c: string[]
  l: string[]
  h: string[]
  v: string[]
}

type GetPricesType = {
  data: {[key: string]: string},
  code: number
}

export default {
  history: history,

  getBars: function ({
    route,
    resolution,
    chainId,
    limit,
    to
  }: {
    route: string
    chainId: number
    resolution: string
    limit: number
    to: number
  }): Promise<CandleType[]> {
    const state = store.getState()
    const tokens = state.tokens.tokens[chainId]

    const routeArr = route.split('/')
    const inputAddress = routeArr[0]
    const outputAddress = routeArr[routeArr.length - 1]
    const inputToken: TokenType = tokens[inputAddress]
    const outputToken: TokenType = tokens[outputAddress]

    const q = route.split('/').join(',')

    const url = `${
      CHART_API_ENDPOINT
    }candleline4?q=${q}&r=${convertResolution(
      resolution
    )}&l=${limit}&t=${to}`
    return fetch(url)
      .then((r: any) => r.json())
      .then((response: CandleFromApiType) => {
        const bars: CandleType[] = []
        if (
          response &&
          response.s === 'ok' &&
          response.t &&
          response.t.length > 0
        ) {
          const decimal = 18 + (outputToken?.decimal || 18) - (inputToken?.decimal || 18)
          for (let i = 0; i < response.t.length; i++) {
            bars.push({
              low: Number(weiToNumber(numberToWei(response.l[i]), decimal)),
              open: Number(weiToNumber(numberToWei(response.o[i]), decimal)),
              time: response.t[i] * 1000,
              volume: Number(weiToNumber(response.v[i].split('.')[0], outputToken?.decimal)),
              close: Number(weiToNumber(numberToWei(response.c[i]), decimal)),
              high: Number(weiToNumber(numberToWei(response.h[i]), decimal))
            })
          }
          return bars
        } else {
          return []
        }
      }).catch((e) => {
        console.error(e)
        return []
      })
  }
}
