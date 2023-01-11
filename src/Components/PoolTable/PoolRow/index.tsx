import { PoolType } from '../../../state/pools/type'
import { useWalletBalance } from '../../../state/wallet/hooks/useBalances'
import { useListTokens } from '../../../state/token/hook'
import React, { useMemo, useState } from 'react'
import { useConfigs } from '../../../state/config/useConfigs'
import { useCurrentPool } from '../../../state/currentPool/hooks/useCurrentPool'
import { bn, formatFloat, shortenAddressString, weiToNumber } from '../../../utils/helpers'
import { PowerState } from 'powerLib'
import { Text, TextBuy, TextSell } from '../../ui/Text'
import { TokenSymbol } from '../../ui/TokenSymbol'
import { ButtonGrey } from '../../ui/Button'
import { Collapse } from 'react-collapse'
import { ExpandPool } from '../ExpandPool'
import './style.scss'
import isEqual from 'react-fast-compare'

const Component = ({ pool }: { pool: PoolType }) => {
  const { balances } = useWalletBalance()
  const { tokens } = useListTokens()
  const [isExpand, setIsExpand] = useState<boolean>(true)
  const { dTokens, powers } = pool
  const { useHistory } = useConfigs()
  const history = useHistory()
  const { updateCurrentPool } = useCurrentPool()

  const [powerState, leverage, value] = useMemo(() => {
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

    return [p, leverage, value]
  }, [pool, balances])

  const TdText = leverage >= 0 ? TextBuy : TextSell

  return <React.Fragment>
    <tr className={`${leverage >= 0 ? 'is-long-pool' : 'is-short-pool'} pool-tr`}
      onClick={(e) => {
        // @ts-ignore
        if (!e.target?.className?.includes('derivable-button')) {
          setIsExpand(!isExpand)
        }
      }}>
      <td className='text-left'>
        <TdText>{shortenAddressString(pool.poolAddress)}</TdText>
      </td>
      <td className='text-left'>
        <TdText>{pool.baseSymbol} ({leverage >= 0 ? 'Long' : 'Short'})</TdText>
      </td>
      <td className='text-left'>
        {
          dTokens.map((dToken, key) => {
            const SymBolText = powers[key] >= 0 ? TextBuy : TextSell
            if (balances[dToken] && balances[dToken].gt(0)) {
              return <div key={key}>
                <Text>{weiToNumber(balances[dToken], tokens[dToken]?.decimal || 18, 4)} </Text>
                <SymBolText><TokenSymbol token={tokens[dToken]} /></SymBolText>
              </div>
            }
            return ''
          })
        }
      </td>
      <td className='text-left'>
        {/* TODO: display as decimal and symbol of quote Token */}
        <TdText>{weiToNumber(value, 18, 4)} BUSD</TdText>
      </td>
      <td className='text-left'>
        <TdText>{formatFloat(leverage, 1)}x</TdText>
      </td>
      <td className='text-right pool-actions'>
        <ButtonGrey
          onClick={async () => {
            updateCurrentPool(pool.poolAddress)
            history.push('swap')
          }}>Swap</ButtonGrey>
        <ButtonGrey
          onClick={async () => {
            updateCurrentPool(pool.poolAddress)
            history.push('exposure')
          }}
        >
          Exposure
        </ButtonGrey>
      </td>
    </tr>
    <td colSpan={6} className='p-0'>
      <Collapse isOpened={isExpand} initialStyle={{ height: 0, overflow: 'hidden' }}>
        <div className='pool-row__expand-box'>
          <div className='pool-row__expand'>
            <ExpandPool visible={isExpand} pool={pool} />
          </div>
        </div>
      </Collapse>
    </td>
  </React.Fragment>
}

export const PoolRow = React.memo(Component, (prevProps, nextProps) =>
  isEqual(prevProps, nextProps)
)
