
import React, { Fragment, useMemo } from 'react'

import './index.scss'
import { PoolGroupType } from '../../../state/resources/type'
import { ZERO_ADDRESS } from '../../../utils/constant'
export const Marker = ({ index }: {index: PoolGroupType}) => {
  const markerText = useMemo(() => {
    return index?.pools?.[0]?.FETCHER === ZERO_ADDRESS ? '' : 'V2'
  }, [index])
  return (
    markerText !== '' ? <span className='marker-text' >
      {markerText}
    </span> : <Fragment/>
  )
}
