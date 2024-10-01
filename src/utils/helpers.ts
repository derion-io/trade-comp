import { BigNumber, ethers } from 'ethers'
import { POOL_IDS, TRADE_TYPE, UNWRAP } from './constant'
import _ from 'lodash'
import { ListTokensType } from '../state/token/type'
import { Q128 } from './type'
import { PoolType } from 'derivable-engine/dist/types'
import moment from 'moment'

const mdp = require('move-decimal-point')

export const bn = ethers.BigNumber.from

export const unwrap = (symbol: string) => {
  return UNWRAP[symbol] ?? symbol
}

export const shortenAddressString = (address: string) => {
  return (
    address.slice?.(0, 6) +
    '...' +
    address.slice?.(address.length - 4, address.length)
  )
}

export const STR = (num: number | string | BigNumber, minimumSignificantDigits?: number): string => {
  if (!num) {
    return '0'
  }
  switch (typeof num) {
    case 'string':
      if (!num?.includes('e')) {
        return num
      }
      num = Number(num)
    case 'number':
      if (!isFinite(num)) {
        return num > 0 ? '∞' : '-∞'
      }
      return num.toLocaleString(['en-US', 'fullwide'], {
        useGrouping: false,
        minimumSignificantDigits,
      })
    default:
      return String(num)
  }
}

export const NUM = (num: number | string | BigNumber): number => {
  if (!num) {
    return 0
  }
  switch (typeof num) {
    case 'number':
      return num
    case 'string':
      if (num == '∞') {
        return Number.POSITIVE_INFINITY
      }
      if (num == '-∞') {
        return Number.NEGATIVE_INFINITY
      }
      return Number.parseFloat(num)
    default:
      return num.toNumber()
  }
}

export const BIG = (num: number | string | BigNumber): BigNumber => {
  if (!num) {
    return BigNumber.from(0)
  }
  switch (typeof num) {
    case 'string':
      if (num?.includes('e')) {
        num = Number(num)
      }
    case 'number':
      return BigNumber.from(num || 0)
    default:
      return num
  }
}

export const NEG = (num: string): string => {
  if (num?.[0] == '-') {
    return num.substring(1)
  }
  return '-' + num
}

export const IS_NEG = (num: string | number | BigNumber): boolean => {
  switch (typeof num) {
    case 'string':
      return num?.[0] == '-'
    case 'number':
      return num < 0
    default:
      return num.isNegative()
  }
}

export const ABS = (num: string): string => {
  if (num?.[0] == '-') {
    return num.substring(1)
  }
  return num
}

export const truncate = (num: string, decimals: number = 0, rounding: boolean = false): string => {
  let index = Math.max(num.lastIndexOf('.'), num.lastIndexOf(','))
  if (index < 0) {
    index = num.length
  }
  index += decimals + (decimals > 0 ? 1 : 0)
  if (rounding) {
    let shouldRoundUp = false
    for (let i = index; i < num.length; ++i) {
      if (num.charAt(i) == '.') {
        continue
      }
      if (Number(num.charAt(i)) >= 5) {
        shouldRoundUp = true
        break
      }
    }
    for (let i = index - 1; shouldRoundUp && i >= 0; --i) {
      let char = num.charAt(i)
      if (char == '.') {
        continue
      }
      if (char == '9') {
        char = '0'
      } else {
        char = (Number(char) + 1).toString()
        shouldRoundUp = false
      }
      num = _replaceAt(num, i, char)
    }
  }
  return num.substring(0, index)
}

export const round = (num: string, decimals: number = 0): string => {
  return truncate(num, decimals, true)
}

function _replaceAt(str: string, index: number, replacement: string) {
  return str.substring(0, index) + replacement + str.substring(index + replacement.length)
}

/// revert of WEI: weiToNumber
export const IEW = (
  wei: BigNumber | string,
  decimals: number = 18,
  decimalsToDisplay?: number
): string => {
  let num = mdp(STR(wei), -decimals)
  if (decimalsToDisplay != null) {
    num = truncate(num, decimalsToDisplay)
  }
  return num
}

/// numberToWei
export const WEI = (num: number | string, decimals: number = 18): string => {
  return truncate(mdp(STR(num), decimals))
}

export const DIV = (a: BigNumber, b: BigNumber, precision = 4): string => {
  const al = a.toString().length
  const bl = b.toString().length
  const d = al - bl
  if (d > 0) {
    b = b.mul(WEI(1, d))
  } else if (d < 0) {
    a = a.mul(WEI(1, -d))
  }
  a = a.mul(WEI(1, precision))
  const c = truncate(a.div(b).toString(), 0, true)
  return mdp(c, d - precision)
}

export const MUL = (a: any, b: any): string => {
  a = STR(a, 4)
  b = STR(b, 4)
  const [aa, da] = remDec(a)
  const [bb, db] = remDec(b)
  return mdp(STR(BIG(aa).mul(BIG(bb))), -da-db)
}

export const pow = (x: any, k: number): string => {
  if (k == 0) {
    return '1'
  }
  let xk = x
  const p = Math.abs(k)
  for (let i = 1; i < p; ++i) {
    xk = mul(xk, x)
  }
  if (k < 0) {
    xk = div(1, xk)
  }
  return xk
}

export const remDec = (s: string): [string, number] => {
  const d = countDecimals(s)
  return [mdp(s, d), d]
}

export const countDecimals = (s: string): number => {
  return countDigits(s)[1] ?? 0
}

export const countDigits = (s: string): number[] => {
  return s.split('.').map(p => p.length)
}

export const maxBN = (a: BigNumber, b: BigNumber) => {
  if (a.gt(b)) {
    return a
  }
  return b
}

export const minBN = (a: BigNumber, b: BigNumber) => {
  if (a.lt(b)) {
    return a
  }
  return b
}

export function overrideContract(provider: any, deployedBytecode: string) {
  if (typeof provider.setStateOverride === 'undefined') {
    // eslint-disable-next-line no-throw-literal
    throw 'provider: state override not supported'
  }
  const address = ethers.utils.keccak256(deployedBytecode).substring(0, 42)
  provider.setStateOverride({
    ...provider.getStateOverride(),
    [address]: { code: deployedBytecode }
  })
  return address
}

const CALL_REVERT_REGEX = /reason string "(.*?)"/gm

export const parseCallStaticError = (err: any) => {
  const reason = err?.reason ?? err?.message ?? _extractErrorReason(err)?.reason ?? 'ERROR'
  if (reason.includes('missing revert data in call exception')) {
    console.error(reason)
    return 'Execution Reverted'
  }
  if (reason.startsWith('execution reverted: ')) {
    return reason.substr(20)
  }
  const matches = Array.from(
    reason.matchAll(CALL_REVERT_REGEX),
    (m: string[]) => m[1]
  )
  return matches?.[0] ?? reason
}

function _extractErrorReason(err: any) {
  if (typeof err?.error?.body === 'string') {
    try {
      const rre = JSON.parse(err?.error?.body)
      if (!_.isEmpty(rre)) {
        let reason = rre?.error?.message
        if (reason.startsWith('execution reverted: ')) {
          reason = reason.substr(20)
        }
        return { reason, err: rre }
      }
    } catch (eee) {
      console.error(eee)
    }
  }
  const reason = String(err?.reason ?? err?.error?.body ?? err)
  return { reason, err }
}

export const formatFloat = (
  number: number | string,
  decimals?: number,
  significantDigits?: number,
  rounding: boolean = false
): number => {
  if (decimals == null) {
    decimals = decimalsBySignificantDigits(number, significantDigits)
  }
  return NUM(truncate(STR(number), decimals, rounding))
}

export const cutDecimal = (num: string, decimals?: number): string => {
  if (!decimals) {
    decimals = decimalsBySignificantDigits(num)
  }
  return truncate(num, decimals)
}

export const mul = (a: any, b: any): string => {
  return MUL(a, b)
}

export const add = (a: any, b: any) => {
  a = STR(a, 4)
  b = STR(b, 4)
  const d = Math.max(countDecimals(a), countDecimals(b))
  return mdp(BIG(mdp(a, d)).add(mdp(b, d)), -d)
}

export const sub = (a: any, b: any) => {
  a = STR(a, 4)
  b = STR(b, 4)
  const d = Math.max(countDecimals(a), countDecimals(b))
  return mdp(BIG(mdp(a, d)).sub(mdp(b, d)), -d)
}

export const div = (a: any, b: any, precision: number = 4) => {
  if (Number?.(b) === 0) return 0
  a = STR(a, 4)
  b = STR(b, 4)
  const [bb, db] = remDec(b)
  const aa = truncate(mdp(a, db + precision))
  return mdp(
    DIV(BIG(aa), BIG(bb)),
    -precision
  )
}

export const max = (a: any, b: any) => {
  if (typeof a === 'number' && typeof b === 'number') {
    return a > b ? a : b
  }
  return sub(a, b).startsWith('-') ? b : a
}

export const formatPercent = (
  floatNumber: any,
  decimals: number = 2,
  rounding: boolean = false
): number => {
  return NUM(truncate(mdp(STR(floatNumber), 2), decimals, rounding))
}

export const getNormalAddress = (addresses: string[]) => {
  return addresses.filter((adr: string) => /^0x[0-9,a-f,A-Z]{40}$/g.test(adr))
}

/**
 *
 * @param addresses address with format 0x...-id
 * example 0x72bB2D0F05D6b0c346023f978F6fA19e9e3c353c-0
 */
export const getErc1155Token = (addresses: string[]) => {
  const erc1155Addresses = addresses.filter(isErc1155Address)
  const result: {[address: string]: BigNumber[]} = {}
  for (let i = 0; i < erc1155Addresses.length; i++) {
    const address = erc1155Addresses[i].split('-')[0]
    const id = erc1155Addresses[i].split('-')[1]
    if (!result[address]) {
      result[address] = [bn(id)]
    } else {
      result[address].push(bn(id))
    }
  }
  return result
}

export const isErc1155Address = (address: string) => {
  return /^0x[0-9,a-f,A-Z]{40}-[0-9]{1,}$/g.test(address)
}

export const decodeErc1155Address = (address: string) => {
  if (!address) return { address: '', id: '' }
  return {
    address: address.split('-')[0],
    id: address.split('-')[1]
  }
}

export const encodeErc1155Address = (token: string, side: number): string => {
  return token + '-' + side
}

export const parseUq112x112 = (value: BigNumber, unit = 1000) => {
  return value.mul(unit).shr(112).toNumber() / unit
}

export const formatMultiCallBignumber = (data: any) => {
  return data.map((item: any) => {
    if (item.type === 'BigNumber') {
      item = bn(item.hex)
    }

    if (Array.isArray(item)) {
      item = formatMultiCallBignumber(item)
    }
    return item
  })
}

export const formatDate = (timestamp: number) => {
  if (!timestamp) return ''

  const date = new Date(timestamp)
  const d = date.getDate()
  const m = date.getMonth() + 1 // Month from 0 to 11
  const y = date.getFullYear()
  return y + '-' + (m <= 9 ? '0' + m : m) + '-' + (d <= 9 ? '0' + d : d)
}

export const formatTime = (timestamp: number) => {
  if (!timestamp) return ''

  const date = new Date(timestamp)
  const h = date.getHours()
  const m = date.getMinutes() + 1 // Month from 0 to 11
  const s = date.getSeconds()
  return (
    (h <= 9 ? '0' + h : h) +
    ':' +
    (m <= 9 ? '0' + m : m) +
    ':' +
    (s <= 9 ? '0' + s : s)
  )
}

export const decimalsBySignificantDigits = (
  num: number | string,
  significantDigits: number = 4
): number => {
  num = Math.abs(NUM(num))
  if (num === 0) {
    return 0
  }
  const decimals =
    num >= 1
      ? significantDigits - countDigits(STR(num))[0]
      : significantDigits + countDigits(STR(1/num))[0] - 1

  return Math.max(0, decimals)
}

export const getPoolPower = (pool: any): number => {
  const { k, exp } = pool
  if (!k || !exp) return 0
  return k?.toNumber?.() / exp
}

export const getTitleBuyTradeType = (type: TRADE_TYPE): string => {
  switch (type) {
    case TRADE_TYPE.LONG:
      return 'Long'
    case TRADE_TYPE.SHORT:
      return 'Short'
    default:
      return 'Liquidity'
  }
}

export const tradeTypeToId = (type: TRADE_TYPE): number => {
  switch (type) {
    case TRADE_TYPE.LONG:
      return POOL_IDS.A
    case TRADE_TYPE.SHORT:
      return POOL_IDS.B
    default:
      return POOL_IDS.C
  }
}

export const isUSD = (symbol: string): boolean => {
  return (
    symbol?.includes('USD') ||
    symbol?.includes('DAI') ||
    symbol?.includes('SAI')
  )
}

export const thousandsInt = (int: string): string => {
  const rgx = /(\d+)(\d{3})/
  while (rgx.test(int)) {
    int = int.replace(rgx, '$1' + ',' + '$2')
  }
  return int
}

export const precisionize = (value: number, opts?: {
  maximumSignificantDigits?: number,
  minimumSignificantDigits?: number,
  maxExtraDigits?: number,
}): string => {
  const maxExtraDigits = opts?.maxExtraDigits ?? 0
  const extraDigits = Math.min(
    maxExtraDigits,
    value >= 1 ? 2 : value >= 0.1 ? 1 : 0,
  )
  const minimumSignificantDigits = extraDigits + (opts?.minimumSignificantDigits ?? 1)
  const maximumSignificantDigits = extraDigits + (opts?.maximumSignificantDigits ?? 4)
  const stringOpts = {
    minimumSignificantDigits,
    maximumSignificantDigits,
  }
  return value.toLocaleString(['en-US', 'fullwide'], stringOpts)
}

export const zerofy = (value: number | string, opts?: {
  maxZeros?: number,
  maximumSignificantDigits?: number,
  minimumSignificantDigits?: number,
  maxExtraDigits?: number,
}): string => {
  let zeros = 0
  if (typeof value === 'number') {
    if (value < 0) {
      return '-' + zerofy(-value, opts)
    }
    zeros = -Math.floor(Math.log10(value) + 1)
    if (!Number.isFinite(zeros)) {
      zeros = 0
    }
    value = precisionize(value, opts)
  } else {
    value = STR(value)
    if (IS_NEG(value)) {
      return '-' + zerofy(NEG(value), opts)
    }
    let [int, dec] = value.split('.')
    if (dec?.length > 0) {
      const fake = int.substring(Math.max(0, int.length - 2)) + '.' + dec
      dec = precisionize(NUM(fake), opts)
      dec = dec.split('.')[1]
      int = thousandsInt(int)
      if (dec?.length > 0) {
        value = int + '.' + dec
        zeros = dec.match(/^0+/)?.[0]?.length ?? 0
      } else {
        value = int
      }
    } else {
      value = thousandsInt(value)
    }
  }
  const maxZeros = opts?.maxZeros ?? 3
  if (zeros > maxZeros) {
    const zs = zeros.toString()
    let ucZeros = ''
    for (let i = 0; i < zs.length; ++i) {
      ucZeros += String.fromCharCode(parseInt(`+208${zs[i]}`, 16))
    }
    value = value.replace(/[.,]{1}0+/, `${whatDecimalSeparator()}0${ucZeros}`)
  }
  return value
}

export const xr = (k: number, r: BigNumber, v: BigNumber): number => {
  try {
    const x = NUM(DIV(r, v))
    return Math.pow(x, 1 / k)
  } catch (err) {
    console.warn(err)
    return 0
  }
}

export const kx = (
  k: number,
  R: BigNumber,
  v: BigNumber,
  spot: BigNumber,
  MARK: BigNumber
): number => {
  try {
    const xk = k > 0 ? spot.pow(k).div(MARK.pow(k)) : MARK.pow(-k).div(spot.pow(-k))
    const vxk4 = v.mul(xk).shl(2)
    const denom = vxk4.gt(R) ? vxk4.sub(R) : R.sub(vxk4)
    const num = R.mul(Math.abs(k))
    return NUM(DIV(num, denom))
  } catch (err) {
    console.warn(err)
    return 0
  }
}

export const whatDecimalSeparator = (): string => {
  // const n = 1.1
  // return n.toLocaleString().substring(1, 2)
  return '.'
}
export const calculateWeightedAverage = (numbers: number[], weights: number[]): number | null => {
  if (numbers.length !== weights.length) return null
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
  if (totalWeight === 0) return null
  const weightedSum = numbers.reduce((sum, number, index) => sum + number * weights[index], 0)
  return weightedSum / totalWeight
}
export const oracleToPoolGroupId = (ORACLE: string): string => {
  return ethers.utils.getAddress('0x' + ORACLE.substring(26))
}

export const calcPoolSide = (
  pool: any,
  side: number,
  tokens: ListTokensType = {},
  currentPrice?: string | number,
): any => {
  const {
    states: { a, b, R },
    exp,
    MARK,
    baseToken,
    quoteToken,
    sides
  } = pool
  const k = pool.k.toNumber()
  const leverage = k / exp
  const ek = sides[side].k
  const effectiveLeverage = Math.min(ek, k) / exp

  const decimalsOffset = Math.floor((
    (tokens[baseToken]?.decimals ?? 18) -
    (tokens[quoteToken]?.decimals ?? 18)
  ) / exp)

  const mark = !MARK ? 1 : NUM(DIV(
    MARK.mul(decimalsOffset > 0 ? bn(10).pow(decimalsOffset) : 1),
    Q128.mul(decimalsOffset < 0 ? bn(10).pow(-decimalsOffset) : 1),
  ))**exp

  const xA = xr(k, R.shr(1), a)
  const xB = xr(-k, R.shr(1), b)
  const dgA = xA**exp * mark
  const dgB = xB**exp * mark


  const interest = sides[side].interest
  const premium = sides[side].premium
  const funding = interest + premium

  return {
    exp,
    mark,
    leverage,
    effectiveLeverage,
    dgA,
    dgB,
    interest,
    premium,
    funding,
  }
}

// extract the integer number before the decimal point
export const numInt = (v: any): string => {
  return v.split('.')[0]
}

// extract the decimals part including the decimal point
export const numDec = (v: any): string => {
  return v.match(/\.[\d₀₁₂₃₄₅₆₇₈₉]+$/g) || ''
}

export async function downloadImage(dataURI: string, filename: string) {
  const blob = await (await fetch(dataURI)).blob()
  if (typeof (window.navigator as any)?.msSaveBlob !== 'undefined') {
    (window.navigator as any).msSaveBlob(blob, filename)
    return
  }
  const blobURL = window.URL.createObjectURL(blob)
  const tempLink = document.createElement('a')
  tempLink.style.display = 'none'
  tempLink.href = blobURL
  tempLink.setAttribute('download', filename)
  if (typeof tempLink.download === 'undefined') {
    tempLink.setAttribute('target', '_blank')
  }
  document.body.appendChild(tempLink)
  tempLink.click()
  document.body.removeChild(tempLink)
  setTimeout(() => {
    window.URL.revokeObjectURL(blobURL)
  }, 100)
}

export function getTwitterIntentURL(text: string, url = '', hashtag = '') {
  let finalURL = 'https://twitter.com/intent/tweet?text='
  if (text.length > 0) {
    finalURL += Array.isArray(text) ? text.map((t) => encodeURIComponent(t)).join('%0a%0a') : encodeURIComponent(text)
    if (hashtag.length > 0) {
      finalURL += '&hashtags=' + encodeURIComponent(hashtag.replace(/#/g, ''))
    }
    if (url.length > 0) {
      finalURL += '&url=' + encodeURIComponent(url)
    }
  }
  return finalURL
}

export const detectTradeTab = (path: string) => {
  if (path.includes('long')) {
    return TRADE_TYPE.LONG
  } else if (path.includes('short')) {
    return TRADE_TYPE.SHORT
  } else if (path.includes('liquidity')) {
    return TRADE_TYPE.LIQUIDITY
  } else if (path.includes('swap')) {
    return TRADE_TYPE.SWAP
  }
  return TRADE_TYPE.LONG
}
export function poolToIndexID(pool: PoolType) {
  const pair = oracleToPoolGroupId(pool?.ORACLE)
  const quoteTokenIndex = bn(pool?.ORACLE.slice(0, 3)).gt(0) ? 1 : 0
  const tokenR = pool?.TOKEN_R
  return [pair, quoteTokenIndex, tokenR].join('-')
}

export const packId = (kind: string | BigNumber, address: string) => {
  const k = bn(kind)
  return k.shl(160).add(address)
}

export const formatMaturity = (duration: number | BigNumber, removeSingularPaticle: boolean = false): string => {
  if (duration instanceof BigNumber) {
    duration = duration?.toNumber() ?? 0
  }
  const s = moment.unix(duration ?? 0).from(0, true)
  if (removeSingularPaticle) {
    if (s.startsWith('a ')) {
      return s.slice(2)
    }
    if (s.startsWith('an ')) {
      return s.slice(3)
    }
  }
  return s
}
