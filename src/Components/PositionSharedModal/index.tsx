import { BigNumber } from 'ethers'
import React, { useMemo } from 'react'
import isEqual from 'react-fast-compare'
import { useResource } from '../../state/resources/hooks/useResource'
import {
  POOL_IDS
} from '../../utils/constant'
import {
  decodeErc1155Address
} from '../../utils/helpers'
import { Position } from '../../utils/type'
import { VALUE_IN_USD_STATUS } from '../Positions'
import { DerivableIcon, DerivableIconSmall } from '../ui/Icon'
import { Modal } from '../ui/Modal'
import './style.scss'
import { TokenSymbol } from '../ui/TokenSymbol'

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
            <div>
              {/* <QRCodeSVG
                size={isMobile ? 24 : 32}
                value={success && code ? `${homeURL}/#/?ref=${code}` : `${homeURL}`}
              /> */}
            </div>
            <div className='referral-code-info'>
              {/* {success && code ? (
                <>
                  <p className='label'>Referral Code:</p>
                  <p className='code'>{code}</p>
                </>
              ) : ( */}
              <p className='code'>https://gmx.io</p>
              {/* )} */}
            </div>
          </div>
        </div>
        {/* {loading && (
          <div className='image-overlay-wrapper'>
            <div className='image-overlay'>
              <SpinningLoader />
              <p className='loading-text'>
                <Trans>Generating shareable image...</Trans>
              </p>
            </div>
          </div>
        )} */}
      </div>
    </Modal>
  )
}

export const SharedPosition = React.memo(Component, (prevProps, nextProps) =>
  isEqual(prevProps, nextProps)
)
