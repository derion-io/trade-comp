import { BigNumber, ethers, utils } from 'ethers'

export const bn = ethers.BigNumber.from

export const shortenAddressString = (address: string) => {
  return address.slice?.(0, 6) + '...' + address.slice?.(address.length - 4, address.length)
}

export const weiToNumber = (wei: any, decimal: number = 18, decimalToDisplay?: number) => {
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
  const message = error.data?.message
    ? error.data?.message?.replace('check error: ', '') || 'Error'
    : error.message
  if (message.includes('reason="')) {
    const arr = message.split('reason="')
    const m = arr[1]
    return m?.split('"')[0]
  }
  if (message.includes('insufficient funds for gas * price + value')) {
    return 'insufficient funds for gas * price + value'
  }
  return message
}

export const formatFloat = (number: number | string, decimal = 1) => {
  number = number.toString()
  const arr = number.split('.')
  if (arr.length > 1) {
    arr[1] = arr[1].slice(0, decimal)
  }
  return Number(arr.join('.'))
}
