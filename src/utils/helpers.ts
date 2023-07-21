import { BigNumber, ethers, utils } from 'ethers'
import { POOL_IDS, TRADE_TYPE } from './constant'
import _ from 'lodash'

export const bn = ethers.BigNumber.from

export const shortenAddressString = (address: string) => {
  return address.slice?.(0, 6) + '...' + address.slice?.(address.length - 4, address.length)
}

export const weiToNumber = (wei: any, decimal: number = 18, decimalToDisplay?: number): string => {
  if (!wei || !Number(wei)) return '0'
  wei = wei.toString()
  const result = utils.formatUnits(wei, decimal)
  const num = result.indexOf('.') === result.length - 1
    ? result.slice(0, -1)
    : result
  if (decimalToDisplay) {
    return num.slice(0, result.indexOf('.') + decimalToDisplay)
  }
  return num
}
export const numberToWei = (number: any, decimal: number = 18) => {
  if (!number) return '0'
  number = number.toString()

  const arr = number.split('.')
  if (arr[1] && arr[1].length > decimal) {
    arr[1] = arr[1].slice(0, decimal)
    number = arr.join('.')
  }

  return utils.parseUnits(number, decimal).toString()
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
    throw 'provider: state override not supported'
  }
  const address = ethers.utils.keccak256(deployedBytecode).substring(0, 42)
  provider.setStateOverride({
    ...provider.getStateOverride(),
    [address]: { code: deployedBytecode }
  })
  return address
}

export const parseCallStaticError = (error: any) => {
  return _extractErrorReason(error)?.reason ?? 'ERROR'
}

function _extractErrorReason(err: any) {
  if (typeof err?.error?.body == 'string') {
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
  const reason = err?.reason ?? err?.error?.body ?? err
  return { reason, err }
}

export const formatFloat = (number: number | string, decimal?: number) => {
  if (!decimal) {
    decimal = detectDecimalFromPrice(number)
  }

  number = number.toString()
  const arr = number.split('.')
  if (arr.length > 1) {
    arr[1] = arr[1].slice(0, decimal)
  }
  return Number(arr.join('.'))
}

export const cutDecimal = (number: string, decimal?: number) => {
  if (!decimal) {
    decimal = detectDecimalFromPrice(number)
  }

  number = number.toString()
  const arr = number.split('.')
  if (arr.length > 1) {
    arr[1] = arr[1].slice(0, decimal)
  }
  return arr.join('.')
}

export const mul = (a: any, b: any) => {
  const result = weiToNumber(
    BigNumber.from(numberToWei(a)).mul(numberToWei(b)),
    36
  )
  const arr = result.split('.')
  arr[1] = arr[1]?.slice(0, 18)
  return arr[1] ? arr.join('.') : arr.join('')
}

export const sub = (a: any, b: any) => {
  return weiToNumber(BigNumber.from(numberToWei(a)).sub(numberToWei(b)))
}

export const div = (a: any, b: any) => {
  if (!b || b.toString() === '0') {
    return '0'
  }
  return weiToNumber(BigNumber.from(numberToWei(a, 36)).div(numberToWei(b)))
}

export const add = (a: any, b: any) => {
  return weiToNumber(BigNumber.from(numberToWei(a)).add(numberToWei(b)))
}

export const formatPercent = (floatNumber: any, decimal: number = 2, rounding: boolean = false) => {
  if (rounding) {
    return Math.round(Number(floatNumber) * 10**(decimal+2)) / 10**decimal
  }
  floatNumber = floatNumber.toString()
  return formatFloat(weiToNumber(numberToWei(floatNumber), 16), decimal)
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

export const detectDecimalFromPrice = (price: number | string) => {
  if (Number(price || 0) === 0 || Number(price || 0) >= 1) {
    return 4
  } else {
    const rate = !bn(numberToWei(price)).isZero()
      ? weiToNumber(
        BigNumber.from(numberToWei(1, 36)).div(numberToWei(price)).toString()
      )
      : '0'
    return rate.split('.')[0].length + 3
  }
}

export const getTokenPower = (
  TOKEN_R: string,
  baseToken: string,
  id: number, k: number) => {
  if (id === POOL_IDS.C) return k / 2
  return (TOKEN_R === baseToken && id !== POOL_IDS.C ? 1 : 0) + (id === POOL_IDS.B ? -1 : 1) * k / 2
}

export const getTitleBuyTradeType = (type: TRADE_TYPE) : string => {
  switch (type) {
    case TRADE_TYPE.LONG:
      return 'Long'
    case TRADE_TYPE.SHORT:
      return 'Short'
    default:
      return 'Liquidity'
  }
}

export const tradeTypeToId = (type: TRADE_TYPE) : number => {
  switch (type) {
    case TRADE_TYPE.LONG:
      return POOL_IDS.A
    case TRADE_TYPE.SHORT:
      return POOL_IDS.B
    default:
      return POOL_IDS.C
  }
}
