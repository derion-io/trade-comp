import React, { useMemo, useRef, useState } from 'react'
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
  const { id } = useCurrentPoolGroup()
  const wrapperRef = useRef(null)
  useOutsideAlerter(wrapperRef, () => setActive(false))

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
        <PoolGroupOption poolGroup={poolGroups[id]} className='active' />
        {active && Object.keys(poolGroups).length > 1 && (
          <div
            className={
              'select-pool-group__dropdown noselect ' +
              (!active ? 'un-active' : '')
            }
          >
            {poolGroups &&
              Object.keys(poolGroups)
                .filter((key) => key !== id)
                .map((uniPair: any) => (
                  <PoolGroupOption
                    key={uniPair}
                    id={uniPair}
                    poolGroup={poolGroups[uniPair]}
                  />
                ))}
          </div>
        )}
      </div>
    </div>
  )
}

const PoolGroupOption = ({
  poolGroup,
  className,
  id
}: {
  id?: string
  poolGroup: any
  className?: string
}) => {
  const { balances } = useWalletBalance()
  const { tokens } = useListTokens()
  const { updateCurrentPoolGroup } = useCurrentPoolGroup()
  const { getTokenValue } = useTokenValue({})
  const playingTokens = useMemo(() => {
    if (!poolGroup) return []
    const pools = Object.keys(poolGroup.pools)
    const results = []
    let hasLp = false
    for (const poolAddress of pools) {
      if (balances[poolAddress + '-' + POOL_IDS.A]) {
        results.push(poolAddress + '-' + POOL_IDS.A)
      }
      if (balances[poolAddress + '-' + POOL_IDS.B]) {
        results.push(poolAddress + '-' + POOL_IDS.B)
      }
      if (balances[poolAddress + '-' + POOL_IDS.C] && !hasLp) {
        results.unshift(poolAddress + '-' + POOL_IDS.C)
        hasLp = true
      }
    }
    return results
  }, [poolGroup, balances])

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
      {playingTokens.map((address) => {
        const valueUsd = getTokenValue(
          address,
          IEW(balances[address], tokens[address]?.decimal || 18),
          true
        )
        if (Number(valueUsd) < MIN_POSITON_VALUE_USD_TO_DISPLAY) return null
        if (balances[address] && bn(balances[address]).gt(0)) {
          return <TokenIcon key={address} size={20} tokenAddress={address} />
        } else {
          return null
        }
      })}
    </div>
  )
}
