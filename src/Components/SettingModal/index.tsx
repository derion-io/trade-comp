import React from 'react'
import './style.scss'
import isEqual from 'react-fast-compare'
import { ButtonExecute } from '../ui/Button'
import { Text } from '../ui/Text'
import { TokenSymbol } from '../ui/TokenSymbol'

const Component = ({
  visible,
  setVisible,
  poolGroupData,
  callBack
}: {
  visible: boolean
  setVisible: any
  poolGroupData: any
  callBack?: any
}) => {
  const getAllReserveToken = () => {
    const poolGroupDataKeys = Object.keys(poolGroupData)
    const reserveTokenArr = []
    for (let i = 0; i < Object.keys(poolGroupData).length; i++) {
      reserveTokenArr.push(poolGroupData[poolGroupDataKeys[i]].TOKEN_R)
    }
    return reserveTokenArr
  }

  const sortUnique = (arr: any) => {
    if (arr.length === 0) return arr
    arr = arr.sort()
    var ret = [arr[0]]
    for (var i = 1; i < arr.length; i++) {
      if (arr[i - 1] !== arr[i]) {
        ret.push(arr[i])
      }
    }
    return ret
  }

  return (
    <div className={`swap-modal  ${visible ? 'show' : ''}`}>
      <div className='overlay' onClick={() => setVisible(false)} />
      <div className='modal' style={{ minWidth: '500px', minHeight: '300px' }}>
        <div className='btn-close-wrap'>
          <span className='title'>Setting</span>
          <span className='btn-close' onClick={() => setVisible(false)}>
            {/* <ExitIcon /> */}X
          </span>
        </div>
        <div className='modal-content'>
          <div className='beverage-modal'>
            <div
              style={{
                display: 'flex',
                gap: '20px',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <span>Min pool reserve percentage: </span>
              <input
                type='text'
                style={{ width: '100px', borderRadius: '4px' }}
              />
            </div>
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
            >
              <span>Reserve token: </span>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                {sortUnique(getAllReserveToken()).map((item: any, idx: any) => (
                  <div style={{ display: 'flex', gap: '10px' }} key={idx}>
                    <input type='checkbox' />
                    <Text>
                      <TokenSymbol token={item} />
                    </Text>
                  </div>
                ))}
              </div>
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

export const SettingModal = React.memo(Component, (prevProps, nextProps) =>
  isEqual(prevProps, nextProps)
)
