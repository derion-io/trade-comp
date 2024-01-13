import { BigNumber, ethers } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'
import { bn } from './helpers'

export const formatNumber = (
  number: number,
  minPrecision = 2,
  maxPrecision = 2
) => {
  const options = {
    minimumFractionDigits: minPrecision,
    maximumFractionDigits: maxPrecision
  }
  return number.toLocaleString(['en-US', 'fullwide'], options)
}

/**
 * Method to format the display of wei given an ethers.BigNumber object
 * Note: does NOT round
 */
export const formatBigNumber = (
  number: ethers.BigNumber,
  displayDecimals = 18,
  decimals = 18
) => {
  const remainder = number.mod(
    ethers.BigNumber.from(10).pow(decimals - displayDecimals)
  )
  return formatUnits(number.sub(remainder), decimals)
}

/**
 * Method to format the display of wei given an ethers.BigNumber object with toFixed
 * Note: rounds
 */
export const formatBigNumberToFixed = (
  number: ethers.BigNumber,
  displayDecimals = 18,
  decimals = 18
) => {
  const formattedString = formatUnits(number, decimals)
  return (+formattedString).toFixed(displayDecimals)
}

/**
 * Formats a FixedNumber like BigNumber
 * i.e. Formats 9763410526137450427.1196 into 9.763 (3 display decimals)
 */
export const formatFixedNumber = (
  number: ethers.FixedNumber,
  displayDecimals = 18,
  decimals = 18
) => {
  // Remove decimals
  const [leftSide] = number.toString().split('.')
  return formatBigNumber(
    ethers.BigNumber.from(leftSide),
    displayDecimals,
    decimals
  )
}

export const formatLocalisedCompactNumber = (number: number): string => {
  return new Intl.NumberFormat(['en-US', 'fullwide'], {
    // notation: 'compact',
    // @ts-ignore
    compactDisplay: 'long',
    maximumSignificantDigits: 18
  }).format(number)
}

export const formatWeiToDisplayNumber = (
  wei: string | number | BigNumber,
  displayDecimals = 4,
  decimals = 18
) => {
  if (bn(wei).isZero()) {
    return '0'
  }
  const fixedNumber = formatBigNumberToFixed(
    ethers.BigNumber.from(wei),
    displayDecimals,
    decimals
  )
  return formatLocalisedCompactNumber(Number(fixedNumber))
}

export default formatLocalisedCompactNumber
