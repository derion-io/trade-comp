import React, { useMemo } from 'react'
import { useConfigs } from '../../state/config/useConfigs'
import { CHAINS } from '../../utils/constant'
import { Logo } from '../ui/Icon'
import { Text, TextLink, TextPink } from '../ui/Text'
import './style.scss'
export const PagePoolInvalidIndicator = () => {
  const { chainId } = useConfigs()

  const chainName = useMemo(() => {
    const _index = Object.values(CHAINS).indexOf(chainId)
    const chainname = Object.keys(CHAINS)[_index].toLowerCase()
    return chainname.charAt(0).toUpperCase() + chainname.slice(1)
  }, [chainId])
  return (
    <div className='page-loading-indicator__wrap'>
      <div className='page-loading-indicator__logo'>
        <Logo width={360} height={60} />
      </div>
      <span style={{ textAlign: 'center', fontSize: '18px' }}>
        Oops! This pool address isn't on <TextPink fontSize={18}> {chainName}</TextPink>. Try another network or check <TextLink fontSize={18} href='#'>default indexes</TextLink>
      </span>
      <div className='page-loading-indicator'>
        {/* <div/> */}
        {/* <div />
        <div />
        <div />
        <div />
        <div />
        <div />
        <div />
        <div /> */}
      </div>
    </div>
  )
}
