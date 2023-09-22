import React, {
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
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
import { TextGrey } from '../ui/Text'
import formatLocalisedCompactNumber from '../../utils/formatBalance'
import { useWindowSize } from '../../hooks/useWindowSize'

export const SelectPoolGroup = () => {
  const [active, setActive] = useState<boolean>(false)
  const { poolGroups } = useResource()
  const { id } = useCurrentPoolGroup()
  const wrapperRef = useRef(null)
  useOutsideAlerter(wrapperRef, () => setActive(false))
  const { balances } = useWalletBalance()
  const { tokens } = useListTokens()
  const { getTokenValue } = useTokenValue({})
  const [poolGroupsValue, setPoolGroupsValue] = useState<any>()
  const { width } = useWindowSize()
  const isPhone = width && width < 768
  const getPoolValue = (pool: any): number => {
    return Number(
      getTokenValue(
        pool?.TOKEN_R,
        IEW(pool?.states?.R, tokens[pool?.TOKEN_R]?.decimals),
        true
      )
    )
  }
  useMemo(() => {
    const poolGroupsUSDs = {}
    Object.keys(poolGroups).map((poolGroupKey: string) => {
      const poolGroup = poolGroups[poolGroupKey]
      let totalPosValue = 0
      let totalLiquidValue = 0
      if (!poolGroup) return []
      const poolsKey = Object.keys(poolGroup.pools)
      const results = []
      if (Object.keys(balances).length === 0) {
        for (const poolAddress of Object.keys(poolGroup.pools)) {
          totalLiquidValue += getPoolValue(poolGroup.pools[poolAddress])
        }
      } else {
        for (const poolAddress of poolsKey) {
          if (balances[poolAddress + '-' + POOL_IDS.A]) { results.push(poolAddress + '-' + POOL_IDS.A) }
          if (balances[poolAddress + '-' + POOL_IDS.B]) { results.push(poolAddress + '-' + POOL_IDS.B) }
          if (balances[poolAddress + '-' + POOL_IDS.C]) {
            results.unshift(poolAddress + '-' + POOL_IDS.C)
            totalLiquidValue += getPoolValue(poolGroup.pools[poolAddress])
          }
        }
      }
      const playingTokensValue = results.map((address) => {
        const value = Number(
          getTokenValue(
            address,
            IEW(balances[address], tokens[address]?.decimal || 18),
            true
          )
        )
        totalPosValue += value
        return { address, value }
      })
      poolGroupsUSDs[poolGroupKey] = {
        poolGroup,
        playingTokensValue,
        totalPosValue,
        totalLiquidValue
      }
      return null
    })
    const poolGroupsUSDsEntries = Object.entries(poolGroupsUSDs)

    poolGroupsUSDsEntries.sort(
      ([, a], [, b]) =>
        ((b as any).totalPosValue ?? 0) - ((a as any).totalPosValue ?? 0) ||
        ((b as any).totalLiquidValue ?? 0) - ((a as any).totalLiquidValue ?? 0)
    )

    const sortedPoolGroupsUSDs = {}
    for (const [key, value] of poolGroupsUSDsEntries) { sortedPoolGroupsUSDs[key] = value }
    setPoolGroupsValue(sortedPoolGroupsUSDs)
  }, [poolGroups, balances, tokens])

  useEffect(() => {
    if (!isPhone || !wrapperRef.current) return
    const wrapper = wrapperRef.current as any
    wrapper.classList.toggle('select-pool-group-open', !active)
    wrapper.classList.toggle('select-pool-group-close', active)
  }, [active, isPhone])

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
        <PoolGroupOption
          active={active}
          slice={3}
          poolGroupsValue={poolGroupsValue[id]}
          className='active'
        />
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
  active,
  slice
}: {
  id?: string
  poolGroupsValue: {
    playingTokensValue: any
    poolGroup: any
    totalPosValue: number
    totalLiquidValue: number
  }
  className?: string
  active?: boolean
  slice?: number
}) => {
  const { chainId } = useConfigs()
  const poolGroup = poolGroupsValue?.poolGroup
  const { balances } = useWalletBalance()
  const { tokens } = useListTokens()
  const { updateCurrentPoolGroup } = useCurrentPoolGroup()
  const { width } = useWindowSize()
  const isPhone = width && width < 768
  if (!poolGroup) return <React.Fragment />

  return (
    <div
      className={'select-pool-group__option noselect ' + className}
      onClick={() => {
        if (id) {
          updateCurrentPoolGroup(id)
          localStorage.setItem('activeIndex-' + chainId, id)
        }
      }}
    >
      <span>
        {tokens[poolGroup.baseToken]?.symbol}/
        {tokens[poolGroup.quoteToken]?.symbol}{' '}
        {className !== 'active' || active ? (
          <TextGrey>
            {`${
              poolGroupsValue.totalLiquidValue !== 0
                ? `($${formatLocalisedCompactNumber(
                    formatFloat(Math.round(poolGroupsValue.totalLiquidValue), 0)
                  )})`
                : ''
            }`}
          </TextGrey>
        ) : (
          ''
        )}
      </span>
      {(!active && isPhone && slice
        ? poolGroupsValue.playingTokensValue?.slice(0, slice)
        : poolGroupsValue?.playingTokensValue
      ).map((playingToken: any) => {
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
