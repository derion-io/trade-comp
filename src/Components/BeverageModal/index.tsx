import React, { useState } from 'react'
import './style.scss'
import isEqual from 'react-fast-compare'
import { ButtonExecute } from '../ui/Button'
import { useConfigs } from '../../state/config/useConfigs'
import { toast } from 'react-toastify'
import { SliderBar } from '../SliderBar'

const Component = ({
  visible,
  setVisible,
  callBack
}: {
  visible: boolean
  setVisible: any
  callBack?: any
}) => {
  const [leverage, setLeverage] = useState<number>(1)
  return (
    <div className={`swap-modal  ${visible ? 'show' : ''}`}>
      <div className='overlay' onClick={() => setVisible(false)} />
      <div className='modal' style={{ minWidth: '384px' }}>
        <div className='btn-close-wrap'>
          <span className='title'>Adjust Leverage</span>
          <span className='btn-close' onClick={() => setVisible(false)}>
            {/* <ExitIcon /> */}X
          </span>
        </div>
        <div className='modal-content'>
          <div className='beverage-modal'>
            <p className='mb-2'>Leverage</p>
            <div
              className='mb-2'
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                height: '48px',
                padding: '12px',
                backgroundColor: '#2B3139',
                borderRadius: '4px'
              }}
            >
              +
              <div>
                <p style={{ fontSize: '16px', color: '#EAECEF' }}>{leverage}</p>
              </div>
              -
            </div>
            <div>
              <SliderBar
                minLeverage={0}
                maxLeverage={50}
                leverage={leverage}
                setLeverage={setLeverage}
              />
            </div>
            <div className='text-center'>
              <ButtonExecute>Confirm</ButtonExecute>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const BeverageModal = React.memo(Component, (prevProps, nextProps) =>
  isEqual(prevProps, nextProps)
)
