import React, { useEffect } from 'react'
import './style.scss'
import { useDisableScroll } from '../../../hooks/useDisableScroll'

export interface modalInterface {
  setVisible: any
  visible: any
  children: any
  width?: any
  minWidth?: any
  title?: any
}

export default ({
  width,
  minWidth,
  setVisible,
  visible,
  children,
  title
}: modalInterface) => {
  const { enableScroll, disableScroll } = useDisableScroll()
  useEffect(() => {
    window.addEventListener('keyup', (e: any) => {
      if (e.which === 27) {
        setVisible(false)
      }
    })
  }, [])

  useEffect(() => {
    if (visible) {
      disableScroll()
    } else {
      enableScroll()
    }
  }, [visible])

  return (
    <div className={`swap-modal  ${visible ? 'show' : ''}`}>
      <div className='overlay' onClick={() => setVisible(false)} />
      <div
        className='modal'
        style={{ width: width || '40rem', minWidth: minWidth || '40rem' }}
      >
        <div className='btn-close-wrap'>
          <span className='title'>{title || ''}</span>
          <span className='btn-close' onClick={() => setVisible(false)}>
            {/* <ExitIcon /> */}X
          </span>
        </div>
        {visible && <div className='modal-content'>{children}</div>}
      </div>
    </div>
  )
}
