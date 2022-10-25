import React from 'react'
import './style.scss'
import { matchPath } from 'react-router'
import { Exposure } from '../../pages/Exposure'
import { Swap } from '../../pages/Swap'

export const App = () => {
  const renderAppContent = () => {
    switch (true) {
      case isMatchWithPath('exposure'):
        return <Exposure />
      case isMatchWithPath('swap'):
        return <Swap />
      default:
        return <Exposure />
    }
  }

  const isMatchWithPath = (path: string) => {
    return !!matchPath({
      path,
      // @ts-ignore
      exact: true,
      // @ts-ignore
      strict: false
    }, location.pathname)
  }

  return (
    <div className='exposure-interface app'>
      {renderAppContent()}
    </div>
  )
}
