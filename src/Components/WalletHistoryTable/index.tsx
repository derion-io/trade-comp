import React from 'react'
import './style.scss'
import { SwapTxType } from '../../state/wallet/type'
import { useCurrentPool } from '../../state/currentPool/hooks/useCurrentPool'
import { TokenIcon } from '../ui/TokenIcon'
import { TokenSymbol } from '../ui/TokenSymbol'
import { useListTokens } from '../../state/token/hook'
import { formatWeiToDisplayNumber } from '../../utils/formatBalance'
import moment from 'moment'
import { TextLink } from '../ui/Text'
import { useConfigs } from '../../state/config/useConfigs'
import { bn } from '../../utils/helpers'
import { POOL_IDS } from '../../utils/constant'
import { BigNumber } from 'ethers'

export const WalletHistoryTable = ({ swapTxs }: { swapTxs: SwapTxType[] }) => {
  const { cToken, baseId, quoteId, baseToken, quoteToken } = useCurrentPool()
  const { tokens } = useListTokens()
  const { configs } = useConfigs()

  console.log('tokens', tokens)

  return (
    <div className='wallet-history-table-wrap'>
      <table className='wallet-history-table'>
        <thead>
          <tr>
            <th className='text-left'>Time</th>
            <th className='text-left'>Change</th>
            <th className='text-left' />
          </tr>
        </thead>
        <tbody>
          {
            swapTxs.map((swapTx, key) => {
              const leverageChange = swapTx.oldLeverage
                ? <span>
                  <Leverage leverage={swapTx.oldLeverage} /> -&gt; <Leverage leverage={swapTx.newLeverage} />
                </span>
                : <span>-&gt; <Leverage leverage={swapTx.newLeverage} /></span>

              const cChange = getErc20AmountChange(swapTx.oldBalances, swapTx.newBalances, POOL_IDS.cToken)
              const nativeChange = getErc20AmountChange(swapTx.oldBalances, swapTx.newBalances, POOL_IDS.native)
              const cpChange = getErc20AmountChange(swapTx.newBalances, swapTx.oldBalances, POOL_IDS.cp)
              const baseChange = getErc20AmountChange(swapTx.oldBalances, swapTx.newBalances, baseId)
              const quoteChange = getErc20AmountChange(swapTx.oldBalances, swapTx.newBalances, quoteId)

              return <tr
                key={key}
                className={`
                  ${cChange.isZero() && 'is-change-leverage'}
                  ${cChange.gt(0) && 'is-add'}
                  ${cChange.lt(0) && 'is-remove'}
                `}
              >
                <td className='wallet-history-table__time'>
                  <span>
                    {swapTx.timeStamp && moment().to(swapTx.timeStamp * 1000, true) + ' ago'}
                  </span>
                </td>
                <td className='wallet-history-table__change-info'>
                  {
                    !cChange.isZero() &&
                    <span>
                      {cChange.gte(0) && '+'}{formatWeiToDisplayNumber(cChange, 4, tokens[cToken]?.decimal || 18)} <TokenSymbol token={tokens[cToken]}/>
                    </span>
                  }
                  {
                    !nativeChange.isZero() &&
                    <span>
                      {nativeChange.gte(0) && '+'}{formatWeiToDisplayNumber(nativeChange, 4, tokens[configs.addresses.nativeToken]?.decimal || 18)} <TokenSymbol token={tokens[configs.addresses.nativeToken]}/>
                    </span>
                  }
                  {
                    !quoteChange.isZero() &&
                    <span>
                      {quoteChange.gte(0) && '+'}{formatWeiToDisplayNumber(quoteChange, 4, tokens[quoteToken]?.decimal || 18)} <TokenSymbol token={tokens[quoteToken]}/>
                    </span>
                  }
                  {
                    !baseChange.isZero() &&
                    <span>
                      {baseChange.gte(0) && '+'}{formatWeiToDisplayNumber(baseChange, 4, tokens[baseToken]?.decimal || 18)} <TokenSymbol token={tokens[baseToken]}/>
                    </span>
                  }
                  {
                    !cpChange.isZero() &&
                    <span>
                      {cpChange.gt(0) ? '->' : '<-'} {formatWeiToDisplayNumber(cpChange, tokens[cToken]?.decimal || 18, 4)} CP
                    </span>
                  }
                  <span>{swapTx.oldLeverage !== swapTx.newLeverage ? leverageChange : ''}</span>
                </td>
                <td>
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

const getErc20AmountChange = (oldBalances: {[key: number]: BigNumber}, newBalances: {[key: number]: BigNumber}, id: number | string) => {
  return bn(oldBalances && oldBalances[id]
    ? oldBalances[id] : 0
  ).sub(newBalances && newBalances[id]
    ? newBalances[id] : 0
  )
}

const Leverage = ({ leverage }: { leverage: number }) => {
  return <span>{leverage > 0 ? 'Long ' : 'Short '} {leverage}</span>
}
