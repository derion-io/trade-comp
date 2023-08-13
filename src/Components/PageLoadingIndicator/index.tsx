import React from 'react'
import './style.scss'
import { DerivableIcon } from '../ui/Icon'

export const PageLoadingIndicator = () => {
  return <div className='page-loading-indicator__wrap'>
    <DerivableIcon width={360} height={60} />
    <div className='page-loading-indicator'>
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
    </div>
  </div>
}
