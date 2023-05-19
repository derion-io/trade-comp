import React, { useMemo, useRef, useState } from 'react'
import { useListPool } from '../../state/resources/hooks/useListPool'
import { useCurrentPool } from '../../state/currentPool/hooks/useCurrentPool'
import { useListTokens } from '../../state/token/hook'
import './style.scss'
import { useOutsideAlerter } from '../../hooks/useHandleClickOutside'
import { useWalletBalance } from '../../state/wallet/hooks/useBalances'
import { POOL_IDS } from '../../utils/constant'
import { TextBlue, TextBuy, TextSell } from '../ui/Text'

export const SelectPoolGroup = () => {
  const [active, setActive] = useState<boolean>(false)
  const { poolGroups } = useListPool()
  const { id } = useCurrentPool()
  const wrapperRef = useRef(null)
  useOutsideAlerter(wrapperRef, () => setActive(false))

  return <div
    onClick={() => {
      setActive(!active)
    }}
    className='select-pool-group__wrap'
    ref={wrapperRef}
  >
    <div className='select-pool-group'>
      <PoolGroupOption poolGroup={poolGroups[id]} className='active' />
      {
        active &&
        <div className={'select-pool-group__dropdown noselect ' + (!active ? 'un-active' : '')}>
          {
            poolGroups &&
            Object.keys(poolGroups)
              .filter((key) => key !== id)
              .map((uniPair: any) => <PoolGroupOption key={uniPair} poolGroup={poolGroups[uniPair]} />)
          }
        </div>
      }
    </div>
  </div>
}

const PoolGroupOption = ({ poolGroup, className }: { poolGroup: any, className?: string }) => {
  const { balances } = useWalletBalance()
  const { tokens } = useListTokens()

  const [hasLong, hasShort, hasLP] = useMemo(() => {
    if (!poolGroup) return [false, false, false]
    const pools = Object.keys(poolGroup.pools)
    let _hasLong = false
    let _hasShort = false
    let _hasLP = false
    for (const poolAddress of pools) {
      if (balances[poolAddress + '-' + POOL_IDS.A]) {
        _hasLong = true
      }
      if (balances[poolAddress + '-' + POOL_IDS.B]) {
        _hasShort = true
      }
      if (balances[poolAddress + '-' + POOL_IDS.C]) {
        _hasLP = true
      }
    }
    return [_hasLong, _hasShort, _hasLP]
  }, [poolGroup, balances])

  if (!poolGroup) return <React.Fragment />

  return <div
    className={'select-pool-group__option noselect ' + className}
  >
    <span>{tokens[poolGroup.baseToken]?.symbol}/{tokens[poolGroup.quoteToken]?.symbol}</span>
    {hasLong && <TextBuy>L</TextBuy>}
    {hasShort && <TextSell>S</TextSell>}
    {hasLP && <TextBlue>LP</TextBlue>}
  </div>
}
