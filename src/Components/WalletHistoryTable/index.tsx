import React, { useMemo } from 'react'
import './style.scss'
import { SwapTxType } from '../../state/wallet/type'
import { useCurrentPoolGroup } from '../../state/currentPool/hooks/useCurrentPoolGroup'
import { TokenSymbol } from '../ui/TokenSymbol'
import { useListTokens } from '../../state/token/hook'
import { formatWeiToDisplayNumber } from '../../utils/formatBalance'
import moment from 'moment'
import { Text, TextBlue, TextBuy, TextLink, TextPink, TextSell } from '../ui/Text'
import { useConfigs } from '../../state/config/useConfigs'
import { shortenAddressString } from '../../utils/helpers'
import { NATIVE_ADDRESS, POOL_IDS, TRADE_TYPE } from '../../utils/constant'
import isEqual from 'react-fast-compare'

const Component = ({ swapTxs }: { swapTxs: SwapTxType[] }) => {
  const { setChartTimeFocus, TOKEN_R, tradeType } = useCurrentPoolGroup()
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

  const displaySwapTxs = useMemo(() => {
    if (swapTxs && swapTxs.length > 0) {
      return swapTxs.filter((p) => {
        if (tradeType === TRADE_TYPE.LIQUIDITY) {
          return p.sideIn.eq(POOL_IDS.C) || p.sideOut.eq(POOL_IDS.C)
        }
        if (tradeType === TRADE_TYPE.LONG || tradeType === TRADE_TYPE.SHORT) {
          return p.sideIn.eq(POOL_IDS.A) || p.sideIn.eq(POOL_IDS.B) || p.sideOut.eq(POOL_IDS.A) || p.sideOut.eq(POOL_IDS.B)
        }
        return true
      })
    }
    return []
  }, [swapTxs, tradeType])

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
              <th>From</th>
              <th/>
              <th>To</th>
            </tr>
          </thead>
          <tbody>
            {
              displaySwapTxs.map((swapTx, key) => {
                const TextIn = getColor(swapTx.tokenIn)
                const TextOut = getColor(swapTx.tokenOut)
                return <tr className='wallet-history-table__row' key={key} onClick={() => {
                  setChartTimeFocus(0)
                  setTimeout(() => {
                    setChartTimeFocus(swapTx.timeStamp)
                  })
                }}>
                  <td className='wallet-history-table__time'>
                    <TextLink href={configs.explorer + '/tx/' + swapTx.transactionHash}>
                      {moment.unix(swapTx.timeStamp).fromNow()}
                    </TextLink>
                  </td>
                  <td className='wallet-history-table__ctoken-change'>
                    <TextIn><TokenSymbol token={swapTx.tokenIn} /></TextIn>
                    <Text> {formatWeiToDisplayNumber(swapTx.amountIn, 4, tokens[swapTx.tokenIn]?.decimal || 18)}</Text>
                  </td>
                  <td className='text-center wallet-history-table__arrow'><TextOut> {'->'} </TextOut></td>
                  <td>
                    <TextOut><TokenSymbol token={swapTx.tokenOut} /></TextOut>
                    <Text> {formatWeiToDisplayNumber(swapTx.amountOut, 4, tokens[swapTx.tokenOut]?.decimal || 18)}</Text>
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

export const WalletHistoryTable = React.memo(Component, (prevProps, nextProps) =>
  isEqual(prevProps, nextProps)
)
