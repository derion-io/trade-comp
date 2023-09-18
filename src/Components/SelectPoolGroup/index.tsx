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
import { IEW, bn, formatFloat } from '../../utils/helpers'
import { useTokenValue } from '../SwapBox/hooks/useTokenValue'
import { useConfigs } from '../../state/config/useConfigs'
import {
  TextGrey
} from '../ui/Text'
import formatLocalisedCompactNumber from '../../utils/formatBalance'
let isManualSelect = false
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
  const getPoolValue = (pool:any):number => {
    return Number(getTokenValue(pool?.TOKEN_R, IEW(pool?.states?.R, tokens[pool?.TOKEN_R]?.decimals), true))
  }
  const { chainId } = useConfigs()
  useMemo(() => {
    if (isManualSelect) return
    const maxValuePoolGroupCache = localStorage.getItem('maxValuePoolGroup')
    if (maxValuePoolGroupCache !== null && poolGroups && Object.values(poolGroups).length > 0 && poolGroups[maxValuePoolGroupCache]) {
      updateCurrentPoolGroup(String(maxValuePoolGroupCache))
    }
    const poolGroupsUSDs = {}
    let userTotalVolume = 0
    Object.keys(poolGroups).map((poolGroupKey: string) => {
      const poolGroup = poolGroups[poolGroupKey]
      let totalPosValue = 0; let totalLiquidValue = 0
      if (!poolGroup) return []
      const poolsKey = Object.keys(poolGroup.pools)
      const results = []
      for (const poolAddress of poolsKey) {
        if (balances[poolAddress + '-' + POOL_IDS.A]) results.push(poolAddress + '-' + POOL_IDS.A)
        if (balances[poolAddress + '-' + POOL_IDS.B]) results.push(poolAddress + '-' + POOL_IDS.B)
        if (balances[poolAddress + '-' + POOL_IDS.C]) {
          results.unshift(poolAddress + '-' + POOL_IDS.C)
          totalLiquidValue += getPoolValue(poolGroup.pools[poolAddress])
        }
      }
      const playingTokensValue = results.map(address => {
        const value = Number(getTokenValue(address, IEW(balances[address], tokens[address]?.decimal || 18), true))
        totalPosValue += value
        return { address, value }
      })
      userTotalVolume += totalPosValue
      poolGroupsUSDs[poolGroupKey] = { poolGroup, playingTokensValue, totalPosValue, totalLiquidValue }
      return null
    })
    const poolGroupsUSDsEntries = Object.entries(poolGroupsUSDs)

    if (userTotalVolume !== 0) poolGroupsUSDsEntries.sort(([, a], [, b]) => (b as any).totalPosValue - (a as any).totalPosValue)
    else poolGroupsUSDsEntries.sort(([, a], [, b]) => (b as any).totalLiquidValue - (a as any).totalLiquidValue)
    const sortedPoolGroupsUSDs = {}

    for (const [key, value] of poolGroupsUSDsEntries) sortedPoolGroupsUSDs[key] = value
    setPoolGroupsValue(sortedPoolGroupsUSDs)
    const maxValuePoolGroup = Object.keys(sortedPoolGroupsUSDs)?.[0]
    if (maxValuePoolGroupCache === null && maxValuePoolGroup && sortedPoolGroupsUSDs[maxValuePoolGroup].totalPosValue !== 0 && sortedPoolGroupsUSDs[maxValuePoolGroup].totalLiquidValue !== 0) {
      localStorage.setItem('maxValuePoolGroup', maxValuePoolGroup)
      updateCurrentPoolGroup(maxValuePoolGroup)
    }
  }, [poolGroups, balances, tokens])
  useEffect(() => {
    if (poolGroups && Object.values(poolGroups).length > 0) localStorage.removeItem('maxValuePoolGroup')
  }, [chainId])
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
        <PoolGroupOption active={active} poolGroupsValue={poolGroupsValue[id]} className='active' />
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
  id,
  active
}: {
  id?: string
  poolGroupsValue: {playingTokensValue: any, poolGroup: any, totalPosValue: number, totalLiquidValue:number}
  className?: string
  active?:boolean
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
          isManualSelect = true
          updateCurrentPoolGroup(id)
        }
      }}
    >
      <span>
        {tokens[poolGroup.baseToken]?.symbol}/
        {tokens[poolGroup.quoteToken]?.symbol} {(className !== 'active' || active)
          ? <TextGrey>{`${(poolGroupsValue.totalLiquidValue !== 0
               ? `($${formatLocalisedCompactNumber(formatFloat(Math.round(poolGroupsValue.totalLiquidValue), 0))})` : '')}`}
          </TextGrey>
          : ''}
          {/* ///12 */}
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
