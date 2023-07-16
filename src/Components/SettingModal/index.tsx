import React, { useEffect, useState } from 'react'
import './style.scss'
import isEqual from 'react-fast-compare'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Text, TextError } from '../ui/Text'
import { Box } from '../ui/Box'
import { useSettings } from '../../state/setting/hooks/useSettings'
import { useConfigs } from '../../state/config/useConfigs'

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
    setMinLiquidity,
    setScanApi
  } = useSettings()
  const { chainId } = useConfigs()

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
        {
          visible &&
          <div className='mb-1'>
            <div className='mb-05'>
              <Text>Scan api Key</Text>
            </div>
            <InputApiKey
              setter={setScanApi}
              defaultValue={settings.scanApiKey[chainId]}
            />
          </div>
        }

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
              suffix='$'
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

const InputApiKey = ({ defaultValue, setter }: {
  defaultValue: string,
  setter: any,
}) => {
  const [value, setValue] = useState(defaultValue)
  const [error, setError] = useState('')

  useEffect(() => {
    validateApiKey()
  }, [value])

  const validateApiKey = async () => {
    const res = await fetch('https://api.arbiscan.io/api?module=block&action=getblocknobytime&timestamp=1689517013&closest=before&apikey=' + value).then((r) => r.json())
    if (res.status === '0' && res.message === 'NOTOK' && res.result) {
      setError(res.result)
    } else {
      setter(value)
      setError('')
    }
  }

  return <div>
    <Input
      value={value}
      onChange={(e) => {
        // @ts-ignore
        setValue(e.target.value)
      }}
    />
    {
      error && <TextError>{error}</TextError>
    }
  </div>
}

const InputWithValidate = ({ suffix = '%', defaultValue, setter, min, max, errorMessage }: {
  defaultValue: number,
  setter: any,
  suffix?: string,
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
      type='number'
      onChange={(e) => {
        // @ts-ignore
        setSlippageState(e.target.value)
      }}
      suffix={suffix}
    />
    {
      (min && slippageState < min) || (max && slippageState > max) ? <TextError>{errorMessage}</TextError> : ''
    }
  </div>
}

export const SettingModal = React.memo(Component, (prevProps, nextProps) =>
  isEqual(prevProps, nextProps)
)
