import React, { useMemo, useState } from 'react'
import { Text, TextBuy, TextSell } from '../ui/Text'
import './style.scss'
import { ButtonGrey } from '../ui/Button'
import { Collapse } from 'react-collapse'
import { ExpandPool } from './ExpandPool'
import { useListPool } from '../../state/pools/hooks/useListPool'
import { PoolType } from '../../state/pools/type'
import { useWalletBalance } from '../../state/wallet/hooks/useBalances'
import { PowerState } from 'powerLib'
import { bn, formatFloat, shortenAddressString, weiToNumber } from '../../utils/helpers'
import { useListTokens } from '../../state/token/hook'
import { TokenSymbol } from '../ui/TokenSymbol'
import { useConfigs } from '../../state/config/useConfigs'
import { useCurrentPool } from '../../state/currentPool/hooks/useCurrentPool'
import { PoolRow } from './PoolRow'
import { PoolRowCompact } from './PoolRowCompact'

export const PoolTable = () => {
  const { pools } = useListPool()

  return (
    <div className='pool-table-wrap'>
      <table className='pool-table'>
        <thead>
          <tr>
            <th className='text-left'>Pool</th>
            <th className='text-left'>Asset</th>
            <th className='text-left'>Size</th>
            <th className='text-left'>Value</th>
            <th className='text-left'>Leverage</th>
            <th className='text-right' />
          </tr>
        </thead>
        <tbody>
          {/* <tr>
            <td colSpan={7}>
              <Input
                placeholder='Search token or address'
                inputWrapProps={{
                  className: 'search-pool-input'
                }}
                suffix={<SearchIcon />}
              />
            </td>
          </tr> */}
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

export const PoolTableCompact = () => {
  const { pools } = useListPool()

  return (
    <div className='pool-table-compact-wrap'>
      <table className='pool-table-compact'>
        <thead>
          <tr>
            <th className='text-left'>Pair</th>
            <th className='text-left'>Value</th>
            <th className='text-left'>Exposure</th>
          </tr>
        </thead>
        <tbody>
          {
            Object.values(pools).map((pool, key) => {
              return <PoolRowCompact pool={pool} key={key} />
            })
          }
        </tbody>
      </table>
    </div>
  )
}
