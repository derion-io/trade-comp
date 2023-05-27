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
import { formatFloat, shortenAddressString } from '../../utils/helpers'
import { NATIVE_ADDRESS, POOL_IDS } from '../../utils/constant'
import { BigNumber } from 'ethers'
import { getErc20AmountChange } from '../../utils/swapHistoryHelper'
import isEqual from 'react-fast-compare'

const Component = ({ swapTxs }: { swapTxs: SwapTxType[] }) => {
  const { setChartTimeFocus, TOKEN_R } = useCurrentPool()
  const { tokens } = useListTokens()
  const { configs } = useConfigs()

  const getColor = (address: string) => {
    if (address === NATIVE_ADDRESS || address === TOKEN_R) {
      return TextPink
    }
    const id = address.split('-')[1]
    if (Number(id) === POOL_IDS.C) {
      return TextBlue
    } else if (Number(id) === POOL_IDS.B) {
      return TextSell
    } else if (Number(id) === POOL_IDS.A) {
      return TextBuy
    } else {
      return Text
    }
  }

  return (
    <div className='wallet-history-table-wrap'>
      {/* <div className='wallet-history-table__head'> */}
      {/*  <TextPink>Wallet history</TextPink> */}
      {/* </div> */}
      <div className='wallet-history-table'>
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>TokenIn</th>
              <th/>
              <th>TokenOut</th>
              <th className='text-right'>Tx</th>
            </tr>
          </thead>
          <tbody>
            {
              swapTxs.map((swapTx, key) => {
                const TextIn = getColor(swapTx.tokenIn)
                const TextOut = getColor(swapTx.tokenOut)
                return <tr className='wallet-history-table__row' key={key} onClick={() => {
                  setChartTimeFocus(0)
                  setTimeout(() => {
                    setChartTimeFocus(swapTx.timeStamp)
                  })
                }}>
                  <td className='wallet-history-table__time'>
                    <TextLink
                      href={configs.explorer + '/tx/' + swapTx.transactionHash}>{swapTx.timeStamp && getTimeLabel(swapTx.timeStamp) + ' ago'}</TextLink>
                  </td>
                  <td className='wallet-history-table__ctoken-change'>
                    <Text>{formatWeiToDisplayNumber(swapTx.amountIn, 4, tokens[swapTx.tokenIn]?.decimal || 18)}</Text>
                    <TextIn><TokenSymbol token={swapTx.tokenIn} /></TextIn>
                  </td>
                  <td className='text-center wallet-history-table__arrow'><TextOut> {'->'} </TextOut></td>
                  <td>
                    <Text>{formatWeiToDisplayNumber(swapTx.amountOut, 4, tokens[swapTx.tokenOut]?.decimal || 18)} </Text>
                    <TextOut><TokenSymbol token={swapTx.tokenOut} /></TextOut>
                  </td>
                  <td className='text-right'>
                    <TextLink
                      href={configs.explorer + '/tx/' + swapTx.transactionHash}>
                      {shortenAddressString(swapTx.transactionHash)}
                    </TextLink>
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
}

const AmountChange = ({ amountChange, address }: { amountChange: BigNumber, address: string }) => {
  const { tokens } = useListTokens()
  if (amountChange.isZero()) return <React.Fragment />
  return <span>
    <TextPink><TokenSymbol token={address} /> </TextPink>
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
