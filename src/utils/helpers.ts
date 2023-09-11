import { BigNumber, Signer, ethers, utils } from 'ethers'
import { POOL_IDS, TRADE_TYPE } from './constant'
import _ from 'lodash'

const mdp = require('move-decimal-point')

export const bn = ethers.BigNumber.from

export const shortenAddressString = (address: string) => {
  return (
    address.slice?.(0, 6) +
    '...' +
    address.slice?.(address.length - 4, address.length)
  )
}

export const STR = (num: number | string | BigNumber): string => {
  if (!num) {
    return '0'
  }
  switch (typeof num) {
    case 'string':
      return num
    case 'number':
      return num.toLocaleString('fullwide', { useGrouping: false })
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
    case 'number':
      return BigNumber.from(Math.floor(num))
    case 'string':
      return BigNumber.from(num || 0)
    default:
      return num
  }
}

export const truncate = (num: string, decimals: number = 0): string => {
  let index = Math.max(num.lastIndexOf('.'), num.lastIndexOf(','))
  if (index < 0) {
    index = num.length
  }
  index += decimals + (decimals > 0 ? 1 : 0)
  return num.substring(0, index)
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
export const WEI = (
  num: number | string,
  decimals: number = 18
): string => {
  return truncate(mdp(STR(num), decimals))
}

export const max = (a: number, b: number) => {
  return a > b ? a : b
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

export const parseCallStaticError = (error: any) => {
  const reason = error?.message ?? _extractErrorReason(error)?.reason ?? 'ERROR'
  if (reason.includes('missing revert data in call exception')) {
    console.error(reason)
    return 'Execution Reverted'
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

export const formatFloat = (number: number | string, decimals?: number): number => {
  if (!decimals) {
    decimals = decimalsBySignificantDigits(number)
  }
  return NUM(truncate(STR(number), decimals))
}

export const cutDecimal = (num: string, decimals?: number): string => {
  if (!decimals) {
    decimals = decimalsBySignificantDigits(num)
  }
  return truncate(num, decimals)
}

export const mul = (a: any, b: any) => {
  const result = IEW(BIG(WEI(a)).mul(WEI(b)), 36)
  return truncate(result, 18)
}

export const sub = (a: any, b: any) => {
  return IEW(BIG(WEI(a)).sub(WEI(b)))
}

export const div = (a: any, b: any) => {
  if (STR(b) == '0') {
    return IEW(WEI(NUM(a) / NUM(b)))
  }
  return IEW(BIG(WEI(a, 36)).div(WEI(b)))
}

export const add = (a: any, b: any) => {
  return IEW(BIG(WEI(a)).add(WEI(b)))
}

export const formatPercent = (
  floatNumber: any,
  decimal: number = 2,
  rounding: boolean = false
) => {
  if (rounding) {
    return Math.round(Number(floatNumber) * 10 ** (decimal + 2)) / 10 ** decimal
  }
  floatNumber = floatNumber.toString()
  return formatFloat(IEW(WEI(floatNumber), 16), decimal)
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
  const result = {}
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

export const decimalsBySignificantDigits = (num: number | string, significantDigits: number = 4): number => {
  num = Math.abs(NUM(num))
  if (num == 0) {
    return 0
  }
  const decimals = num >= 1
    ? significantDigits - STR(Math.floor(num)).length
    : significantDigits + STR(Math.floor(1 / num)).length - 1

  return Math.max(0, decimals)
}

export const getTokenPower = (
  TOKEN_R: string,
  baseToken: string,
  id: number,
  k: number
) => {
  return k / 2
  // if (id === POOL_IDS.C) return k / 2
  // return (TOKEN_R === baseToken && id !== POOL_IDS.C ? 1 : 0) + (id === POOL_IDS.B ? -1 : 1) * k / 2
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

export const formatZeroDecimal = (
  value: number,
  minZeroDecimal: number = 4
): string => {
  const x = value
  const countZeroAfterDot = -Math.floor(Math.log10(x) + 1)
  if (
    Number.isFinite(countZeroAfterDot) &&
    countZeroAfterDot >= minZeroDecimal
  ) {
    const ucZeros = String.fromCharCode(
      parseInt(`+208${countZeroAfterDot}`, 16)
    )
    return x
      .toLocaleString('fullwide', {
        maximumSignificantDigits: 4,
        maximumFractionDigits: 18
      })
      .replace(/[.,]{1}0+/, `${whatDecimalSeparator()}0${ucZeros}`)
  }
  return value.toLocaleString('fullwide', {
    maximumSignificantDigits: 4,
    maximumFractionDigits: 18
  })
}

export const xr = (k: number, r: BigNumber, v: BigNumber): number => {
  try {
    const x = r.mul(1000000).div(v).toNumber() / 1000000
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
    const xk = Math.pow(spot.mul(1000000).div(MARK).toNumber() / 1000000, k)
    const vxk4 = v
      .mul(Math.round(xk * 1000000))
      .shl(2)
      .div(1000000)
    const denom = vxk4.gt(R) ? vxk4.sub(R) : R.sub(vxk4)
    const num = R.mul(k)
    return num.mul(1000000).div(denom).toNumber() / 1000000
  } catch (err) {
    console.warn(err)
    return 0
  }
}

export const whatDecimalSeparator = (): string => {
  const n = 1.1
  return n.toLocaleString().substring(1, 2)
}
