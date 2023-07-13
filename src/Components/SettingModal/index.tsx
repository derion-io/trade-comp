import React, { useEffect, useState } from 'react'
import './style.scss'
import isEqual from 'react-fast-compare'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Text, TextError } from '../ui/Text'
import { Box } from '../ui/Box'
import { useSettings } from '../../state/setting/hooks/useSettings'

const Component = ({
  visible,
  setVisible
}: {
  visible: boolean
  setVisible: any
}) => {
  const {
    settings,
    setSlippage,
    setDeleverageChance,
    setMinInterestRate,
    setPayoffMinRate,
    setMinLiquidity
  } = useSettings()

  return (
    <Modal
      setVisible={setVisible} visible={visible}
      title='Setting'
    >
      <div
        className='swap-setting-modal'
      >
        <div className='mb-1'>
          <div className='mb-05'>
            <Text>Slippage Tolerance</Text>
          </div>
          <InputWithValidate
            defaultValue={settings.slippage}
            min={0}
            max={100}
            setter={setSlippage}
            errorMessage='Invalid Slippage'
          />
        </div>
        <div className='mb-1'>
          <div className='mb-05'>
            <Text>Pay-Off Min Rate</Text>
          </div>
          <InputWithValidate
            defaultValue={settings.payoffMinRate}
            min={0}
            max={100}
            setter={setPayoffMinRate}
            errorMessage='Invalid Pay-Off Min Rate'
          />
        </div>
        <div className='mb-05'>
          <Text>Pool Filter: </Text>
        </div>
        <Box borderColor='default p-1'>
          <div className='mb-1'>
            <div className='mb-05'>
              <Text>Min Interest Rate:</Text>
            </div>
            <InputWithValidate
              defaultValue={settings.minInterestRate}
              min={0}
              max={100}
              setter={setMinInterestRate}
              errorMessage='Invalid Min Interest Rate'
            />
          </div>
          <div className='mb-1'>
            <div className='mb-05'>
              <Text>Min Liquidity:</Text>
            </div>
            <InputWithValidate
              defaultValue={settings.minLiquidity}
              min={0}
              setter={setMinLiquidity}
              errorMessage='Invalid Min Liquidity'
            />
          </div>
          <div>
            <div className='mb-05'>
              <Text>Max Deleverage Chance:</Text>
            </div>
            <InputWithValidate
              defaultValue={settings.deleverageChance}
              min={0}
              max={100}
              setter={setDeleverageChance}
              errorMessage='Invalid Max Deleverage Chance'
            />
          </div>
        </Box>
      </div>
    </Modal>
  )
}

const InputWithValidate = ({ defaultValue, setter, min, max, errorMessage }: {
  defaultValue: number,
  setter: any,
  min?: number,
  max?: number,
  errorMessage: string
}) => {
  const [slippageState, setSlippageState] = useState(defaultValue)

  useEffect(() => {
    if ((!min || slippageState > min) && (!max || slippageState < max)) {
      setter(slippageState)
    }
  }, [slippageState])

  return <div>
    <Input
      value={slippageState}
      onChange={(e) => {
        setSlippageState(Number(e.target.value))
      }}
      suffix='%'
    />
    {
      (min && slippageState < min) || (max && slippageState > max) ? <TextError>{errorMessage}</TextError> : ''
    }
  </div>
}

export const SettingModal = React.memo(Component, (prevProps, nextProps) =>
  isEqual(prevProps, nextProps)
)
