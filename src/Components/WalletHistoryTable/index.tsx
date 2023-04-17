import React, { useCallback } from 'react'
import './style.scss'
import { SwapTxType } from '../../state/wallet/type'
import { useCurrentPool } from '../../state/currentPool/hooks/useCurrentPool'
import { TokenSymbol } from '../ui/TokenSymbol'
import { useListTokens } from '../../state/token/hook'
import { formatWeiToDisplayNumber } from '../../utils/formatBalance'
import moment from 'moment'
import { Text, TextBlue, TextBuy, TextLink, TextPink, TextSell } from '../ui/Text'
import { useConfigs } from '../../state/config/useConfigs'
import { bn, formatFloat } from '../../utils/helpers'
import { POOL_IDS } from '../../utils/constant'
import { BigNumber } from 'ethers'
import { getErc20AmountChange } from '../../utils/swapHistoryHelper'
import isEqual from 'react-fast-compare'

const Component = ({ swapTxs }: { swapTxs: SwapTxType[] }) => {
  const { cToken, baseId, poolAddress, quoteId, baseToken, quoteToken, setChartTimeFocus } = useCurrentPool()
  const { tokens } = useListTokens()
  const { configs } = useConfigs()

  return (
    <div className='wallet-history-table-wrap'>
      <div className='wallet-history-table__head'>
        <TextPink>Wallet history</TextPink>
      </div>
      <div className='wallet-history-table'>
        <table>
          <tbody>
            {
              swapTxs.map((swapTx, key) => {
                const leverageChange = swapTx.oldLeverage !== swapTx.newLeverage
                  ? <span>
                    {swapTx.oldLeverage ? <Leverage leverage={swapTx.oldLeverage} /> : <TextPink>0</TextPink>}
                    {swapTx.newLeverage || swapTx.oldLeverage ? ' -> ' : ''}
                    {swapTx.newLeverage ? <Leverage leverage={swapTx.newLeverage} /> : <TextPink>0</TextPink>}
                  </span>
                  : ''

                const cChange = getErc20AmountChange(swapTx.oldBalances, swapTx.newBalances, POOL_IDS.cToken)
                const nativeChange = getErc20AmountChange(swapTx.oldBalances, swapTx.newBalances, POOL_IDS.native)
                const cpChange = getErc20AmountChange(swapTx.newBalances, swapTx.oldBalances, POOL_IDS.cp)
                const baseChange = getErc20AmountChange(swapTx.oldBalances, swapTx.newBalances, baseId)
                const quoteChange = getErc20AmountChange(swapTx.oldBalances, swapTx.newBalances, quoteId)

                return <tr className='wallet-history-table__row' key={key} onClick={() => {
                  setChartTimeFocus(0)
                  setTimeout(() => {
                    setChartTimeFocus(swapTx.timeStamp)
                  })
                }}>
                  <td className='wallet-history-table__time'>
                    <TextLink href={configs.explorer + '/tx/' + swapTx.transactionHash}>{swapTx.timeStamp && getTimeLabel(swapTx.timeStamp) + ' ago'}</TextLink>
                  </td>
                  <td className='wallet-history-table__ctoken-change'>
                    <AmountChange amountChange={cChange} address={cToken} />
                    <AmountChange amountChange={nativeChange} address={configs.addresses.nativeToken} />
                    <AmountChange amountChange={quoteChange} address={quoteToken} />
                    <AmountChange amountChange={baseChange} address={baseToken} />
                  </td>
                  {
                    (cChange.gt(0) || nativeChange.gt(0) || quoteChange.gt(0) || baseChange.gt(0))
                      ? <td className='wallet-history-table__arrow text-buy'>{'->'}</td>
                      : (cChange.isNegative() || nativeChange.isNegative() || quoteChange.isNegative() || baseChange.isNegative())
                        ? <td className='wallet-history-table__arrow text-sell'>{'<-'}</td>
                        : <td />
                  }
                  <td>
                    {
                      !cpChange.isZero() &&
                  <span>
                    <TextBlue>CP </TextBlue>
                    {formatWeiToDisplayNumber(cpChange, 4, tokens[poolAddress + '-' + POOL_IDS.cp]?.decimal || 18)}
                  </span>
                    }
                    {swapTx.oldLeverage !== swapTx.newLeverage && <span>{leverageChange}</span>}
                  </td>
                </tr>
              })
            }
          </tbody>
        </table>
      </div>
    </div>
  )
}

const getTimeLabel = (timeStamp: number) => {
  return moment().to(timeStamp * 1000, true)
    .replace(' days', 'd')
    .replace(' seconds', ' s')
    .replace(' minutes', 'm')
    .replace(' hours', 'h')
}

const AmountChange = ({ amountChange, address }: { amountChange: BigNumber, address: string }) => {
  const { tokens } = useListTokens()
  if (amountChange.isZero()) return <React.Fragment />
  return <span>
    <TextPink><TokenSymbol token={tokens[address]} /> </TextPink>
    <Text>{formatWeiToDisplayNumber(amountChange.abs(), 4, tokens[address]?.decimal || 18)}</Text>
  </span>
}

const Leverage = ({ leverage }: { leverage: number }) => {
  const Text = leverage > 0 ? TextBuy : TextSell
  return <Text>{leverage > 0 ? 'Long ' : 'Short '} {formatFloat(leverage, 1)}</Text>
}

export const WalletHistoryTable = React.memo(Component, (prevProps, nextProps) =>
  isEqual(prevProps, nextProps)
)
