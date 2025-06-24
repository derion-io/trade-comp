
import React, { Fragment, useMemo } from 'react'

import './index.scss'
import { PoolGroupType } from '../../../state/resources/type'
import { isChainlink, isUniv2 } from '../../../utils/helpers'

export const Marker = ({ index }: {index: PoolGroupType}) => {
  const markerText = useMemo(() => {
    const pool = index?.pools?.[0]
    if (pool) {
      if (isChainlink(pool)) {
        return 'CL'
      }
      if (isUniv2(pool)) {
        return 'V2'
      }
    }
    return ''
  }, [index])
  return (
    markerText !== '' ? <span className='marker-text' >
      {markerText}
    </span> : <Fragment/>
  )
}
