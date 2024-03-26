import React from 'react'
import './style.scss'
import { DerionIcon } from '../ui/Icon'

export const PageLoadingIndicator = () => {
  return (
    <div className='page-loading-indicator__wrap'>
      <div className='page-loading-indicator__logo'>
        <DerionIcon width={360} height={60} />
      </div>
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
  )
}
