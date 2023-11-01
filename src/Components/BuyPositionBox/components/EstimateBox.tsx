import React, { Fragment, useMemo } from 'react'
import { IEW, NUM, calculateWeightedAverage, numInt, numDec, formatFloat, getTitleBuyTradeType, zerofy } from '../../../utils/helpers'
import formatLocalisedCompactNumber, { formatWeiToDisplayNumber } from '../../../utils/formatBalance'
import { TokenSymbol } from '../../ui/TokenSymbol'
import { TRADE_TYPE } from '../../../utils/constant'
import { useWalletBalance } from '../../../state/wallet/hooks/useBalances'
import { useListTokens } from '../../../state/token/hook'
import { Box } from '../../ui/Box'
import { useSettings } from '../../../state/setting/hooks/useSettings'
import { useTokenValue } from '../../SwapBox/hooks/useTokenValue'
import { bn } from 'derivable-tools/dist/utils/helper'
import { SkeletonLoader } from '../../ui/SkeletonLoader'
import { useCurrentPoolGroup } from '../../../state/currentPool/hooks/useCurrentPoolGroup'
import { useConfigs } from '../../../state/config/useConfigs'
import { useSwapHistory } from '../../../state/wallet/hooks/useSwapHistory'
import { useResource } from '../../../state/resources/hooks/useResource'
import { cloneDeep } from 'lodash'

type Props = {
    outputTokenAddress: string,
    tradeType: TRADE_TYPE,
    amountIn: string,
    amountOut: string,
    valueOut: string,
    power: number,
}
export const EstimateBox = ({
  outputTokenAddress,
  tradeType,
  amountIn,
  amountOut,
  valueOut,
  power
}: Props) => {
  const { balances } = useWalletBalance()
  const { tokens } = useListTokens()
  const { settings } = useSettings()
  const { ddlEngine } = useConfigs()
  const { pools } = useResource()
  const { swapLogs: sls } = useSwapHistory()
  const showSize =
  tradeType === TRADE_TYPE.LONG || tradeType === TRADE_TYPE.SHORT
  const { value: valueOutBefore } = useTokenValue({
    amount: IEW(
      balances[outputTokenAddress],
      tokens[outputTokenAddress]?.decimal || 18
    ),
    tokenAddress: outputTokenAddress
  })

  const { basePrice } = useCurrentPoolGroup()
  const positionsWithEntry = useMemo(() => {
    if (ddlEngine?.HISTORY && Object.values(pools).length > 0) {
      return (
        ddlEngine.HISTORY.generatePositions?.({
          tokens: Object.values(tokens),
          logs: cloneDeep(sls)
        }) ?? {}
      )
    }
    return {}
  }, [sls, pools, tokens])
  const afterEntryPrice = useMemo(() => {
    if (!positionsWithEntry[outputTokenAddress]?.entryPrice) return null
    return calculateWeightedAverage(
      [Number(basePrice), Number(positionsWithEntry[outputTokenAddress]?.entryPrice)],
      [Number(valueOut), Number(valueOutBefore)])
  }, [positionsWithEntry, valueOut, valueOutBefore, basePrice])
  if (!outputTokenAddress) return <Fragment/>
  return (
    <Box
      borderColor={
        tradeType === TRADE_TYPE.LONG
          ? 'buy'
          : tradeType === TRADE_TYPE.SHORT
            ? 'sell'
            : 'blue'
      }
      className='estimate-box swap-info-box mt-1 mb-1'
    >
      <span
        className={`estimate-box__leverage ${getTitleBuyTradeType(
          tradeType
        ).toLowerCase()}`}
      >
        <TokenSymbol token={outputTokenAddress} />
      </span>
      <div className='position-delta--box'>
        <div className='position-delta--left'>
          {settings.showBalance && <div>Balance</div>}
          <div>Value</div>
          {showSize && <div>Size</div>}
          <div>Entry Price</div>
        </div>
        <SkeletonLoader loading={balances[outputTokenAddress] == null}>
          {balances[outputTokenAddress]?.gt(0) && (
            <div className='position-delta--group'>
              <div className='position-delta--right'>
                {settings.showBalance && (
                  <div>
                    {
                      formatWeiToDisplayNumber(
                        balances[outputTokenAddress] ?? bn(0),
                        4,
                        tokens[outputTokenAddress]?.decimal || 18
                      ).split('.')[0]
                    }
                  </div>
                )}
                <div>
                  ${numInt(zerofy(formatFloat(valueOutBefore)))}
                </div>
                {showSize && (
                  <div>
                    ${numInt(zerofy(Number(valueOutBefore) * power))}
                  </div>
                )}
                <div>
                  {numInt(zerofy(
                    positionsWithEntry[outputTokenAddress]?.entryPrice || basePrice
                  ))}
                </div>
                {/* <div>
                    $
                  {
                    zerofy(
                      formatFloat(Number(valueOutBefore) * power)
                    ).split('.')[0]
                  }
                </div> */}
              </div>
              <div className='position-delta--left'>
                {settings.showBalance && (
                  <div>
                    {numDec(formatWeiToDisplayNumber(
                      balances[outputTokenAddress] ?? bn(0),
                      4,
                      tokens[outputTokenAddress]?.decimal || 18
                    ))}
                  </div>
                )}
                <div>
                  {numDec(zerofy(NUM(valueOutBefore)))}
                </div>
                {showSize && (
                  <div>
                    {numDec(zerofy(NUM(valueOutBefore) * power))}
                  </div>
                )}
                <div>
                  {numDec(zerofy(
                    NUM(positionsWithEntry[outputTokenAddress]?.entryPrice) || basePrice
                  ))}
                </div>
              </div>
            </div>
          )}
        </SkeletonLoader>
        {!Number(amountIn) || !balances[outputTokenAddress]?.gt(0) ? (
          ''
        ) : (
          <div className='position-delta--left'>
            {settings.showBalance && <div>{'->'}</div>}
            {showSize && <div>{'->'}</div>}
            <div>{'->'}</div>
            <div>{'->'}</div>
          </div>
        )}
        {!Number(amountIn) ? (
          ''
        ) : (
          <SkeletonLoader loading={!Number(valueOut)}>
            <div className='position-delta--group'>
              <div className='position-delta--right'>
                {settings.showBalance && (
                  <div>
                    {
                      numInt(formatLocalisedCompactNumber(
                        formatFloat(Number(amountOut) + Number(formatWeiToDisplayNumber(
                          balances[outputTokenAddress] ?? bn(0),
                          4,
                            tokens[outputTokenAddress]?.decimal || 18
                        )))
                      ))
                    }
                  </div>
                )}
                <div>
                  $
                  {
                    numInt(formatLocalisedCompactNumber(
                      formatFloat(Number(valueOut) + Number(valueOutBefore))
                    ))
                  }
                </div>
                {showSize && (
                  <div>
                    $
                    {
                      numInt(formatLocalisedCompactNumber(
                        formatFloat(Number(valueOut) * power + Number(valueOutBefore) * power)
                      ))
                    }
                  </div>
                )}
                <div>
                  {
                    numInt(zerofy(
                      NUM(afterEntryPrice || basePrice)
                    ))
                  }
                </div>
              </div>
              <div className='position-delta--left'>
                {settings.showBalance && (
                  <div>
                    {numDec(formatLocalisedCompactNumber(
                      formatFloat(Number(amountOut) + Number(IEW(
                        balances[outputTokenAddress],
                            tokens[outputTokenAddress]?.decimal || 18
                      )))
                    ))}
                  </div>
                )}
                <div>
                  {numDec(formatLocalisedCompactNumber(
                    formatFloat(Number(valueOut) + Number(valueOutBefore))
                  ))}
                </div>
                {showSize && (
                  <div>
                    {numDec(formatLocalisedCompactNumber(
                      formatFloat(Number(valueOut) * power + Number(valueOutBefore) * power)
                    ))}
                  </div>
                )}
                <div>
                  {numDec(zerofy(
                    NUM(afterEntryPrice || basePrice)
                  ))}
                </div>
              </div>
            </div>
          </SkeletonLoader>
        )}
      </div>
    </Box>
  )
}
