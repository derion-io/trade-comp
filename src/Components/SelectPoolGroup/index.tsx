import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useResource } from '../../state/resources/hooks/useResource'
import { useCurrentPoolGroup } from '../../state/currentPool/hooks/useCurrentPoolGroup'
import { useListTokens } from '../../state/token/hook'
import './style.scss'
import { useOutsideAlerter } from '../../hooks/useHandleClickOutside'
import { useWalletBalance } from '../../state/wallet/hooks/useBalances'
import {
  MIN_POSITON_VALUE_USD_TO_DISPLAY,
  POOL_IDS
} from '../../utils/constant'
import { TokenIcon } from '../ui/TokenIcon'
import { IEW, bn } from '../../utils/helpers'
import { useTokenValue } from '../SwapBox/hooks/useTokenValue'

export const SelectPoolGroup = () => {
  const [active, setActive] = useState<boolean>(false)
  const { poolGroups } = useResource()
  const { id, updateCurrentPoolGroup} = useCurrentPoolGroup()
  const wrapperRef = useRef(null)
  useOutsideAlerter(wrapperRef, () => setActive(false))
  const { balances } = useWalletBalance()
  const { tokens } = useListTokens()
  const { getTokenValue } = useTokenValue({})
  const [poolGroupsValue, setPoolGroupsValue] = useState<any>()
  useMemo(() => {
    const poolGroupsUSDs = {}
    Object.keys(poolGroups).map((poolGroupKey: string) => {
      const poolGroup = poolGroups[poolGroupKey]
      if (!poolGroup) return []
      const pools = Object.keys(poolGroup.pools)
      const results = []
      let hasLp = false
      for (const poolAddress of pools) {
        if (balances[poolAddress + '-' + POOL_IDS.A]) results.push(poolAddress + '-' + POOL_IDS.A)
        if (balances[poolAddress + '-' + POOL_IDS.B]) results.push(poolAddress + '-' + POOL_IDS.B)
        if (balances[poolAddress + '-' + POOL_IDS.C] && !hasLp) {
          results.unshift(poolAddress + '-' + POOL_IDS.C)
          hasLp = true
        }
      }
      let totalValue = 0
      const playingTokensValue = results.map(address => {
        const value = Number(getTokenValue(address, IEW(balances[address], tokens[address]?.decimal || 18), true))
        totalValue += value
        return { address, value }
      })
      poolGroupsUSDs[poolGroupKey] = { poolGroup, playingTokensValue, totalValue }
      return null
    })
    const poolGroupsUSDsEntries = Object.entries(poolGroupsUSDs)
    poolGroupsUSDsEntries.sort(([, a], [, b]) => (b as any).totalValue - (a as any).totalValue)
    const sortedPoolGroupsUSDs = {}
    for (const [key, value] of poolGroupsUSDsEntries) sortedPoolGroupsUSDs[key] = value
    setPoolGroupsValue(sortedPoolGroupsUSDs)
    if (Object.keys?.(sortedPoolGroupsUSDs)?.[0]) updateCurrentPoolGroup(Object.keys?.(sortedPoolGroupsUSDs)?.[0])
  }, [poolGroups, balances])

  if (!poolGroups || Object.values(poolGroups).length === 0) {
    return <div />
  }
  return (
    <div
      onClick={() => {
        setActive(!active)
      }}
      className='select-pool-group__wrap'
      ref={wrapperRef}
    >
      <div className='select-pool-group'>
        <PoolGroupOption poolGroupsValue={poolGroupsValue[id]} className='active' />
        {active && Object.keys(poolGroups).length > 1 && (
          <div
            className={
              'select-pool-group__dropdown noselect ' +
              (!active ? 'un-active' : '')
            }
          >
            {poolGroupsValue &&
              Object.keys(poolGroupsValue)
                .filter((key) => key !== id)
                .map((uniPair: any) => (
                  <PoolGroupOption
                    key={uniPair}
                    id={uniPair}
                    poolGroupsValue={poolGroupsValue?.[uniPair]}
                  />
                ))}
          </div>
        )}
      </div>
    </div>
  )
}

const PoolGroupOption = ({
  poolGroupsValue,
  className,
  id
}: {
  id?: string
  poolGroupsValue: {playingTokensValue: any, poolGroup: any, totalValue: number}
  className?: string
}) => {
  const poolGroup = poolGroupsValue?.poolGroup
  const { balances } = useWalletBalance()
  const { tokens } = useListTokens()
  const { updateCurrentPoolGroup } = useCurrentPoolGroup()
  if (!poolGroup) return <React.Fragment />

  return (
    <div
      className={'select-pool-group__option noselect ' + className}
      onClick={() => {
        if (id) {
          updateCurrentPoolGroup(id)
        }
      }}
    >
      <span>
        {tokens[poolGroup.baseToken]?.symbol}/
        {tokens[poolGroup.quoteToken]?.symbol}
      </span>
      {poolGroupsValue.playingTokensValue.map((playingToken:any) => {
        const { address, value } = playingToken
        if (value < MIN_POSITON_VALUE_USD_TO_DISPLAY) return null
        if (balances[address] && bn(balances[address]).gt(0)) {
          return <TokenIcon key={address} size={20} tokenAddress={address} />
        } else {
          return null
        }
      })}
    </div>
  )
}
