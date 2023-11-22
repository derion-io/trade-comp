import { useMemo } from 'react'
import { decodeErc1155Address, isErc1155Address } from '../utils/helpers'
import { useResource } from '../state/resources/hooks/useResource'

export const useDetectPool = ({
  inputTokenAddress,
  outputTokenAddress
}: {
  inputTokenAddress: string,
  outputTokenAddress: string
}) => {
  const { pools } = useResource()

  return useMemo(() => {
    if (!inputTokenAddress || !outputTokenAddress || !pools) {
      return null
    }

    const { address } = decodeErc1155Address(isErc1155Address(inputTokenAddress) ? inputTokenAddress : outputTokenAddress)
    const pool = pools[address]
    if (!pool) {
      return null
    }
    return pool
  }, [inputTokenAddress, outputTokenAddress, pools])
}
