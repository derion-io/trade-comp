import { rateDataAggregatorType } from 'derivable-engine/dist/types'
import { useEffect, useState } from 'react'
import { useConfigs } from '../../../state/config/useConfigs'
import { useListTokens } from '../../../state/token/hook'
import { numberToWei } from 'derivable-engine/dist/utils/helper'

export const useCalculatePara = ({
  inputTokenAddress,
  amountIn,
  outputTokenAddress,
  side
}: {
    inputTokenAddress: string,
    amountIn: string,
    outputTokenAddress: string,
    side?: string
}) => {
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [rateData, setRateData] = useState<any>()
  const { tokens } = useListTokens()
  const { configs, ddlEngine } = useConfigs()
  useEffect(() => {
    const fetchRateData = async () => {
      if (!inputTokenAddress || !outputTokenAddress || !amountIn) {
        setLoading(false)
        setRateData(null)
        setError('Invalid input params')
      } else {
        if (configs.derivable?.stateCalHelper && ddlEngine?.AGGREGATOR) {
          const srcDecimals = tokens[inputTokenAddress]?.decimals || 18
          const destDecimals = tokens[outputTokenAddress]?.decimals || 18
          const getRateData = {
            userAddress: configs.derivable.stateCalHelper,
            ignoreChecks: true,
            srcToken: inputTokenAddress,
            srcDecimals,
            srcAmount: numberToWei(amountIn, srcDecimals),
            destToken: outputTokenAddress,
            destDecimals,
            partner: 'derion.io',
            side: side || 'SELL'
          }
          console.log('#getRateData', getRateData)
          setLoading(true)
          try {
            const res = await ddlEngine.AGGREGATOR.getRate(getRateData)
            setRateData(res)
            setLoading(false)
          } catch (e) {
            setError(e.reason || e.message || e.code || JSON.stringify(e))
            setLoading(false)
          }
        }
      }
    }
    fetchRateData()
  }, [inputTokenAddress, outputTokenAddress, amountIn, tokens, side, ddlEngine, configs])

  return {
    loading,
    rateData,
    error
  }
}
