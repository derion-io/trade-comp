import { Text, TextGrey } from '../../ui/Text'
import {
  decodeErc1155Address,
  formatFloat,
  getTokenPower,
  isErc1155Address,
  mul,
  weiToNumber
} from '../../../utils/helpers'
import { Box } from '../../ui/Box'
import React, { useMemo } from 'react'
import { InfoRow } from '../../ui/InfoRow'
import { useCurrentPoolGroup } from '../../../state/currentPool/hooks/useCurrentPoolGroup'
import { useTokenValue } from '../hooks/useTokenValue'
import { useListTokens } from '../../../state/token/hook'
import formatLocalisedCompactNumber from '../../../utils/formatBalance'

export const PoolInfo = ({
  inputTokenAddress,
  outputTokenAddress
}: {
  inputTokenAddress: string,
  outputTokenAddress: string
}) => {
  const { pools } = useCurrentPoolGroup()
  const { tokens } = useListTokens()

  const [poolToShow, id] = useMemo(() => {
    if (isErc1155Address(outputTokenAddress)) {
      const { address, id } = decodeErc1155Address(outputTokenAddress)
      return [pools[address], id]
    } else if (isErc1155Address(inputTokenAddress)) {
      const { address, id } = decodeErc1155Address(inputTokenAddress)
      return [pools[address], id]
    }
    return [null, null]
  }, [pools, inputTokenAddress, outputTokenAddress])

  const { value: liquidity } = useTokenValue({
    amount: weiToNumber(poolToShow?.states?.R, tokens[poolToShow?.TOKEN_R]?.decimals),
    tokenAddress: poolToShow?.TOKEN_R
  })

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
      <Text>
          x{!id ? 0 : Math.abs(getTokenPower(poolToShow.TOKEN_R, poolToShow.baseToken, Number(id), poolToShow.k.toNumber()))}
      </Text>

    </InfoRow>
    <InfoRow>
      <TextGrey>Liquidity:</TextGrey>
      <Text>${formatLocalisedCompactNumber(formatFloat(liquidity, 2))}</Text>
    </InfoRow>
  </Box>
}
