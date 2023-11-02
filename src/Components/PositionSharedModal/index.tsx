import React from 'react'
import isEqual from 'react-fast-compare'
import { Position } from '../../utils/type'
import { DerivableIconSmall } from '../ui/Icon'
import { Modal } from '../ui/Modal'
import { TokenSymbol } from '../ui/TokenSymbol'
import './style.scss'

const Component = ({
  visible,
  setVisible,
  position,
  power
}: {
  visible: boolean
  setVisible: any,
  position: Position,
  power: number
}) => {
  return (
    <Modal
      setVisible={setVisible}
      visible={visible}
    >
      <div className='relative'>
        <div className='position-share long'>
          <DerivableIconSmall className='logo'/>
          {/* <img className='logo' src='icon.svg' alt='Derivable Logo' /> */}
          <ul className='info'>
            <li><TokenSymbol size={22} token={position.token}/></li>
          </ul>
          <h3 className='pnl'>89%</h3>
          <div className='prices'>
            <div>
              <p>Entry Price</p>
              <p className='price'>$0.01</p>
            </div>
            <div>
              <p>Mark Price</p>
              <p className='price'>0.01$</p>
            </div>
          </div>
          <div className='referral-code'>
            <div />
            <div className='referral-code-info' />
          </div>
        </div>

      </div>
    </Modal>
  )
}

export const SharedPosition = React.memo(Component, (prevProps, nextProps) =>
  isEqual(prevProps, nextProps)
)
