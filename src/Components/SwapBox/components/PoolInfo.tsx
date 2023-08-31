import { Text, TextGrey } from '../../ui/Text'
import {
  decodeErc1155Address,
  formatFloat,
  formatPercent,
  isErc1155Address,
  weiToNumber
} from '../../../utils/helpers'
import { Box } from '../../ui/Box'
import React, { useMemo } from 'react'
import { InfoRow } from '../../ui/InfoRow'
import { useCurrentPoolGroup } from '../../../state/currentPool/hooks/useCurrentPoolGroup'
import { useTokenValue } from '../hooks/useTokenValue'
import { useListTokens } from '../../../state/token/hook'
import formatLocalisedCompactNumber, { formatWeiToDisplayNumber } from '../../../utils/formatBalance'
import { SkeletonLoader } from '../../ui/SkeletonLoader'

export const PoolInfo = ({
  inputTokenAddress,
  outputTokenAddress
}: {
  inputTokenAddress: string,
  outputTokenAddress: string
}) => {
  const { pools } = useCurrentPoolGroup()
  const { tokens } = useListTokens()

  const poolToShow = useMemo(() => {
    const tokenAddress = isErc1155Address(outputTokenAddress) ? outputTokenAddress
      : isErc1155Address(inputTokenAddress) ? inputTokenAddress
        : null
    if (!tokenAddress) {
      return null
    }
    const { address } = decodeErc1155Address(tokenAddress)
    return pools[address]
  }, [pools, inputTokenAddress, outputTokenAddress])

  const { value: liquidity } = useTokenValue({
    amount: weiToNumber(poolToShow?.states?.R, tokens[poolToShow?.TOKEN_R]?.decimals),
    tokenAddress: poolToShow?.TOKEN_R
  })

  return <Box borderColor='default' className='swap-info-box mt-1 mb-1'>
    <InfoRow>
      <TextGrey>Liquidity</TextGrey>
      <SkeletonLoader loading={!liquidity || liquidity == '0'}>
        <Text>${formatLocalisedCompactNumber(formatFloat(liquidity, 2))}</Text>
      </SkeletonLoader>
    </InfoRow>
    <InfoRow>
      <TextGrey>Daily Interest Rate</TextGrey>
      <SkeletonLoader loading={!poolToShow}>
        <Text>{formatPercent((poolToShow?.dailyInterestRate ?? 0) / (poolToShow?.k.toNumber() ?? 1), 3, true)}%</Text>
      </SkeletonLoader>
    </InfoRow>
  </Box>
}
