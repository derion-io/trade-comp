import React from 'react'
import { store } from '../../state'

export const messageAndViewOnBsc = ({
  title = '',
  message = '',
  hash = ''
}: {
  title: string
  message?: string
  hash?: string
}) => {
  const state = store.getState()
  const configs = state.configs.configs
  return (
    <div>
      <h4>{title}</h4>
      {message && <p className='mt-1'>{message}</p>}
      {hash && (
        <p className='mt-1'>
          <a
            href={`${configs.explorer}/tx/${hash}`}
            className='bsc-link'
            target='_blank'
            rel='noreferrer'
          >
            View on {configs.scanName}
          </a>
        </p>
      )}
    </div>
  )
}
