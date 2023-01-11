import { PoolType } from '../../../state/pools/type'
import { useWalletBalance } from '../../../state/wallet/hooks/useBalances'
import { useListTokens } from '../../../state/token/hook'
import React, { useMemo } from 'react'
import { useCurrentPool } from '../../../state/currentPool/hooks/useCurrentPool'
import { bn, formatFloat, weiToNumber } from '../../../utils/helpers'
import { PowerState } from 'powerLib'
import { Text, TextBlue, TextBuy, TextSell } from '../../ui/Text'
import { TokenIcon } from '../../ui/TokenIcon'
import isEqual from 'react-fast-compare'

const Component = ({ pool }: { pool: PoolType }) => {
  const { balances } = useWalletBalance()
  const { tokens } = useListTokens()
  const { baseToken, quoteToken } = pool
  const { updateCurrentPool } = useCurrentPool()

  const [leverage, value] = useMemo(() => {
    let leverage = 0
    let value = bn(0)
    const { powers, states, dTokens } = pool
    const p = new PowerState({ powers: powers })
    p.loadStates(states)

    const currentBalances = {}
    powers.forEach((power, key) => {
      if (balances[dTokens[key]] && balances[dTokens[key]].gt(0)) {
        currentBalances[power] = bn(balances[dTokens[key]])
      }
    })

    if (Object.keys(currentBalances).length > 0) {
      leverage = p.calculateCompExposure(currentBalances)
      value = p.calculateCompValue(currentBalances)
    }

    return [leverage, value]
  }, [pool, balances])

  const TdText = leverage >= 0 ? TextBuy : TextSell

  return <React.Fragment>
    <tr
      className='pool-tr'
      onClick={(e) => {
        updateCurrentPool(pool.poolAddress)
      }}
    >
      <td className='pair-name'>
        <span className='pair-logo'>
          <TokenIcon size={24} tokenAddress={baseToken} />
          <TokenIcon size={20} tokenAddress={quoteToken} />
        </span>
        <Text>{tokens[baseToken]?.symbol}/{tokens[quoteToken]?.symbol}</Text>
      </td>
      <td className='text-left'>
        <TextBlue>{weiToNumber(value, 18, 4)} {tokens[quoteToken]?.symbol}</TextBlue>
      </td>
      <td className='text-left'>
        <TdText>{leverage >= 0 ? 'Long' : 'Short'} {formatFloat(leverage, 1)}</TdText>
      </td>
    </tr>
  </React.Fragment>
}

export const PoolRowCompact = React.memo(Component, (prevProps, nextProps) =>
  isEqual(prevProps, nextProps)
)
