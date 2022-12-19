import React from 'react'
import './style.scss'
import { SwapTxType } from '../../state/wallet/type'
import { useCurrentPool } from '../../state/currentPool/hooks/useCurrentPool'
import { TokenSymbol } from '../ui/TokenSymbol'
import { useListTokens } from '../../state/token/hook'
import { formatWeiToDisplayNumber } from '../../utils/formatBalance'
import moment from 'moment'
import { Text, TextBlue, TextBuy, TextLink, TextSell } from '../ui/Text'
import { useConfigs } from '../../state/config/useConfigs'
import { bn, formatFloat } from '../../utils/helpers'
import { POOL_IDS } from '../../utils/constant'
import { BigNumber } from 'ethers'

export const WalletHistoryTable = ({ swapTxs }: { swapTxs: SwapTxType[] }) => {
  const { cToken, baseId, quoteId, baseToken, quoteToken } = useCurrentPool()
  const { tokens } = useListTokens()
  const { configs } = useConfigs()

  return (
    <div className='wallet-history-table-wrap'>
      <table className='wallet-history-table'>
        <tbody>
          {
            swapTxs.map((swapTx, key) => {
              const leverageChange = swapTx.oldLeverage !== swapTx.newLeverage
                ? <span>
                  {swapTx.oldLeverage ? <Leverage leverage={swapTx.oldLeverage} /> : ''}
                  {swapTx.newLeverage && swapTx.oldLeverage ? '->' : ''}
                  {swapTx.newLeverage ? <Leverage leverage={swapTx.newLeverage} /> : ''}
                </span>
                : ''

              const cChange = getErc20AmountChange(swapTx.oldBalances, swapTx.newBalances, POOL_IDS.cToken)
              const nativeChange = getErc20AmountChange(swapTx.oldBalances, swapTx.newBalances, POOL_IDS.native)
              const cpChange = getErc20AmountChange(swapTx.newBalances, swapTx.oldBalances, POOL_IDS.cp)
              const baseChange = getErc20AmountChange(swapTx.oldBalances, swapTx.newBalances, baseId)
              const quoteChange = getErc20AmountChange(swapTx.oldBalances, swapTx.newBalances, quoteId)

              return <tr key={key}>
                <td className='wallet-history-table__time'>
                  <span>
                    {swapTx.timeStamp && moment().to(swapTx.timeStamp * 1000, true) + ' ago'}
                  </span>
                </td>
                <td className='wallet-history-table__ctoken-change'>
                  <AmountChange amountChange={cChange} address={cToken} />
                  <AmountChange amountChange={nativeChange} address={configs.addresses.nativeToken} />
                  <AmountChange amountChange={quoteChange} address={quoteToken} />
                  <AmountChange amountChange={baseChange} address={baseToken} />
                </td>
                <td className='wallet-history-table__arrow'>
                  {
                    cChange.gt(0) || nativeChange.gt(0) ||
                    quoteChange.gt(0) || baseChange.gt(0)
                      ? '->' : '<-'
                  }
                </td>
                <td>
                  {
                    !cpChange.isZero() &&
                  <span>
                    {formatWeiToDisplayNumber(cpChange, 4, tokens[cToken]?.decimal || 18)}
                    <TextBlue> CP</TextBlue>
                  </span>
                  }
                  {swapTx.oldLeverage !== swapTx.newLeverage && <span>{leverageChange}</span>}
                </td>
                <td className='text-right'>
                  <TextLink href={configs.explorer + '/tx/' + swapTx.transactionHash}>View</TextLink>
                </td>
              </tr>
            })
          }
        </tbody>
      </table>
    </div>
  )
}

const getErc20AmountChange = (oldBalances: { [key: number]: BigNumber }, newBalances: { [key: number]: BigNumber }, id: number | string) => {
  return bn(oldBalances && oldBalances[id]
    ? oldBalances[id] : 0
  ).sub(newBalances && newBalances[id]
    ? newBalances[id] : 0
  )
}

const AmountChange = ({ amountChange, address }: { amountChange: BigNumber, address: string }) => {
  const { tokens } = useListTokens()
  if (amountChange.isZero()) return <React.Fragment />
  return <span>
    <Text className={`${amountChange.isNegative() ? 'text-sell' : 'text-buy'}`}>
      {!amountChange.isNegative() && '+'}{formatWeiToDisplayNumber(amountChange, 4, tokens[address]?.decimal || 18)}
    </Text> <TokenSymbol token={tokens[address]} />
  </span>
}

const Leverage = ({ leverage }: { leverage: number }) => {
  const Text = leverage > 0 ? TextBuy : TextSell
  return <Text>{leverage > 0 ? 'Long ' : 'Short '} {formatFloat(leverage, 1)}</Text>
}
