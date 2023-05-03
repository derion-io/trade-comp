import React from 'react'
import './style.scss'
import { useListPool } from '../../state/pools/hooks/useListPool'
import { PoolRow } from './PoolRow'
import { PoolRowCompact } from './PoolRowCompact'
import isEqual from 'react-fast-compare'

const Component = () => {
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
            Object.keys(pools).map((id, key) => {
              return <PoolRow pool={pools[id]} id={id} key={key} />
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

export const PoolTable = React.memo(Component, (prevProps, nextProps) =>
  isEqual(prevProps, nextProps)
)
