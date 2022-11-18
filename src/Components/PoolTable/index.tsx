import React, { useEffect, useMemo, useState } from 'react'
import { Text, TextBuy, TextSell } from '../ui/Text'
import './style.scss'
import { ButtonBorder } from '../ui/Button'
import { Collapse } from 'react-collapse'
import { ExpandPool } from './ExpandPool'
import { Input } from '../ui/Input'
import { SearchIcon } from '../ui/Icon'
import { useListPool } from '../../state/pools/hooks/useListPool'
import { PoolType } from '../../state/pools/type'
import { useWalletBalance } from '../../state/wallet/hooks/useBalances'
import { PowerState } from '../../utils/powerLib'
import { bn, formatFloat, shortenAddressString, weiToNumber } from '../../utils/helpers'
import { useListTokens } from '../../state/token/hook'
import { TokenSymbol } from '../ui/TokenSymbol'

export const PoolTable = () => {
  const { pools } = useListPool()

  return (
    <div className='pool-table-wrap'>
      {/* <Box> */}
      {/*  <Input */}
      {/*    placeholder='Search token or address' */}
      {/*    inputWrapProps={{ */}
      {/*      style: { */}
      {/*        background: 'transparent', */}
      {/*        borderColor: '#6c6c6c' */}
      {/*      } */}
      {/*    }} */}
      {/*  /> */}
      {/* </Box> */}
      <table className='pool-table'>
        <thead>
          <tr>
            <th className='text-left'>Pool</th>
            <th className='text-left'>Asset</th>
            <th className='text-left'>Size</th>
            <th className='text-left'>Net val</th>
            <th className='text-left'>Leverage</th>
            <th className='text-right'>
              <ButtonBorder className='pt-05 pb-05'>Add</ButtonBorder>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={7}>
              <Input
                placeholder='Search token or address'
                inputWrapProps={{
                  className: 'search-pool-input'
                }}
                suffix={<SearchIcon />}
              />
            </td>
          </tr>
          {
            Object.values(pools).map((pool, key) => {
              return <PoolRow pool={pool} key={key} />
            })
          }
        </tbody>
      </table>
    </div>
  )
}

export const PoolRow = ({ pool }: { pool: PoolType }) => {
  const { balances } = useWalletBalance()
  const { tokens } = useListTokens()
  const [isExpand, setIsExpand] = useState<boolean>(true)
  const { dTokens, powers } = pool

  const [powerState, leverage, value] = useMemo(() => {
    console.log('tokens', tokens)
    let leverage = 0
    const value = bn(0)
    const { powers, states, dTokens } = pool
    const p = new PowerState({ powers: powers })
    p.loadStates(states)

    const currentBalances = {}
    powers.forEach((power, key) => {
      if (balances[dTokens[key]]) {
        currentBalances[power] = bn(balances[dTokens[key]])
        // value = p.calculateCompValue(currentBalances)
      }
    })

    if (Object.keys(currentBalances).length > 0) {
      leverage = p.calculateCompExposure(currentBalances)
    }

    return [p, leverage, value]
  }, [pool, balances])

  useEffect(() => {
    console.log(pool)
  }, [pool])
  const TdText = leverage >= 0 ? TextBuy : TextSell

  return <React.Fragment>
    <tr className={`${leverage >= 0 ? 'is-long-pool' : 'is-short-pool'} pool-tr`}
      onClick={() => setIsExpand(!isExpand)}>
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
      <td className='text-right'>
        <svg
          width='16'
          height='16'
          viewBox='0 0 16 16'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
        >
          <path
            fillRule='evenodd'
            clipRule='evenodd'
            d='M7.99992 14.6666C11.6818 14.6666 14.6666 11.6818 14.6666 7.99992C14.6666 4.31802 11.6818 1.33325 7.99992 1.33325C4.31802 1.33325 1.33325 4.31802 1.33325 7.99992C1.33325 11.6818 4.31802 14.6666 7.99992 14.6666ZM6.47132 5.52851C6.21097 5.26816 5.78886 5.26816 5.52851 5.52851C5.26816 5.78886 5.26816 6.21097 5.52851 6.47132L7.05711 7.99992L5.52851 9.52851C5.26816 9.78886 5.26816 10.211 5.52851 10.4713C5.78886 10.7317 6.21097 10.7317 6.47132 10.4713L7.99992 8.94273L9.52851 10.4713C9.78886 10.7317 10.211 10.7317 10.4713 10.4713C10.7317 10.211 10.7317 9.78886 10.4713 9.52851L8.94273 7.99992L10.4713 6.47132C10.7317 6.21097 10.7317 5.78886 10.4713 5.52851C10.211 5.26816 9.78886 5.26816 9.52851 5.52851L7.99992 7.05711L6.47132 5.52851Z'
            fill='#FF7A68'
          />
        </svg>
      </td>
    </tr>
    <td colSpan={6} className='p-0'>
      <Collapse isOpened={isExpand} initialStyle={{ height: 0, overflow: 'hidden' }}>
        <ExpandPool visible={isExpand} />
      </Collapse>
    </td>
  </React.Fragment>
}
