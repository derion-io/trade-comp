import { Text, TextGrey } from '../../ui/Text'
import { decodeErc1155Address, formatFloat, isErc1155Address, mul } from '../../../utils/helpers'
import { Box } from '../../ui/Box'
import React, { useMemo } from 'react'
import { InfoRow } from '../../ui/InfoRow'
import { useCurrentPool } from '../../../state/currentPool/hooks/useCurrentPool'

export const PoolInfo = ({
  inputTokenAddress,
  outputTokenAddress
}: {
  inputTokenAddress: string,
  outputTokenAddress: string
}) => {
  const { pools } = useCurrentPool()

  const poolToShow = useMemo(() => {
    if (isErc1155Address(outputTokenAddress)) {
      return pools[decodeErc1155Address(outputTokenAddress).address]
    } else if (isErc1155Address(inputTokenAddress)) {
      return pools[decodeErc1155Address(inputTokenAddress).address]
    }
    return null
  }, [pools, inputTokenAddress, outputTokenAddress])

  return <Box borderColor='default' className='swap-info-box mt-1 mb-1'>
    <InfoRow>
      <TextGrey>Interest Rate</TextGrey>
      <span>
        {formatFloat(mul(poolToShow?.dailyInterestRate || 0, 100), 3)}%
      </span>
    </InfoRow>
    <InfoRow>
      <TextGrey>Risk Factor</TextGrey>
      <Text>
        {formatFloat(mul(poolToShow?.riskFactor || 0, 100), 3)}%
      </Text>
    </InfoRow>
    <InfoRow>
      <TextGrey>Effective Leverage:</TextGrey>
      <Text>x{poolToShow?.k.toNumber() / 2}</Text>
    </InfoRow>
  </Box>
}
