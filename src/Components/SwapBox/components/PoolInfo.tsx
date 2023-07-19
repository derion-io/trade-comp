import { Text, TextGrey } from '../../ui/Text'
import {
  decodeErc1155Address,
  formatFloat,
  formatPercent,
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
import { POOL_IDS } from '../../../utils/constant'
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

  const [poolToShow, id, deleverageRiskDisplay] = useMemo(() => {
    const tokenAddress = isErc1155Address(outputTokenAddress) ? outputTokenAddress :
      isErc1155Address(inputTokenAddress) ? inputTokenAddress :
      null
    if (!tokenAddress) {
      return [null, null, '']
    }
    const { address, id } = decodeErc1155Address(tokenAddress)
    const poolToShow = pools[address]
    const deleverageRisk: number|null =
      Number(id) == POOL_IDS.A ? poolToShow.deleverageRiskA :
      Number(id) == POOL_IDS.B ? poolToShow.deleverageRiskB :
      Math.max(poolToShow.deleverageRiskA, poolToShow.deleverageRiskB)
    const deleverageRiskDisplay: string =
      deleverageRisk == null ? '' :
      formatPercent(Math.min(100, deleverageRisk), 0, true)+'%'
    return [poolToShow, id, deleverageRiskDisplay ]
  }, [pools, inputTokenAddress, outputTokenAddress])

  const { value: liquidity } = useTokenValue({
    amount: weiToNumber(poolToShow?.states?.R, tokens[poolToShow?.TOKEN_R]?.decimals),
    tokenAddress: poolToShow?.TOKEN_R
  })

  return <Box borderColor='default' className='swap-info-box mt-1 mb-1'>
    <InfoRow>
      <TextGrey>Interest Rate</TextGrey>
      <span>
        {formatPercent(poolToShow?.dailyInterestRate ?? 0, 3, true)}%
      </span>
    </InfoRow>
    {
      deleverageRiskDisplay != '100%' ?
      <InfoRow>
        <TextGrey>Deleverage Risk</TextGrey>
        <Text>
          {deleverageRiskDisplay}
        </Text>
      </InfoRow>
      :
      <InfoRow>
        <TextGrey>Leverage:</TextGrey>
        <Text>
            {!id ? 0 : Math.abs(getTokenPower(poolToShow.TOKEN_R, poolToShow.baseToken, Number(id), poolToShow.k.toNumber()))}x
        </Text>
      </InfoRow>
    }
    <InfoRow>
      <TextGrey>Liquidity</TextGrey>
      <SkeletonLoader loading={!liquidity || liquidity == '0'}>
        <Text>${formatLocalisedCompactNumber(formatFloat(liquidity, 2))}</Text>
      </SkeletonLoader>
    </InfoRow>
  </Box>
}
