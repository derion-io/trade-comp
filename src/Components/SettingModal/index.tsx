import React, { useEffect, useState } from 'react'
import './style.scss'
import isEqual from 'react-fast-compare'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Text, TextError } from '../ui/Text'
import { Box } from '../ui/Box'
import { useSettings } from '../../state/setting/hooks/useSettings'
import { useConfigs } from '../../state/config/useConfigs'
import { SORT_POOL_BY } from '../../state/setting/type'

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
    setMaxDeleverageRisk,
    setMaxInterestRate,
    setMinPayoffRate,
    setMinLiquidityShare,
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
            <Text>Min Pay-Off Rate</Text>
          </div>
          <InputWithValidate
            defaultValue={settings.minPayoffRate}
            min={0}
            max={100}
            setter={setMinPayoffRate}
            errorMessage='Invalid Min Pay-Off Rate'
          />
        </div>
        {
          visible &&
          <div className='mb-1'>
            <div className='mb-05'>
              <Text>Scan API Key</Text>
            </div>
            <InputApiKey
              setter={setScanApi}
              defaultValue={settings.scanApiKey[chainId]}
            />
          </div>
        }

        <div className='mb-05'>
          <Text>Pools Filter</Text>
        </div>
        <Box borderColor='default p-1'>
          <div className='mb-1'>
            <div className='mb-05'>
              <Text>Max Interest Rate</Text>
            </div>
            <InputWithValidate
              defaultValue={settings.maxInterestRate}
              min={0}
              max={100}
              setter={setMaxInterestRate}
              errorMessage='Invalid Max Interest Rate'
            />
          </div>
          <div className='mb-1'>
            <div className='mb-05'>
              <Text>Max Deleverage Risk</Text>
            </div>
            <InputWithValidate
              defaultValue={settings.maxDeleverageRisk}
              min={0}
              max={100}
              setter={setMaxDeleverageRisk}
              errorMessage='Invalid Max Deleverage Risk'
            />
          </div>
          <div className='mb-1'>
            <div className='mb-05'>
              <Text>Min Liquidity Share</Text>
            </div>
            <InputWithValidate
              defaultValue={settings.minLiquidityShare}
              min={0}
              suffix='%'
              setter={setMinLiquidityShare}
              errorMessage='Invalid Min Liquidity Share'
            />
          </div>
          <div>
            <div className='mb-05'>
              <Text>Sort</Text>
            </div>
            <div className='sort-by__items'>
              <BtnSortPool
                type={SORT_POOL_BY.LIQUIDITY}
                title='Liquidity'
              />
              <BtnSortPool
                type={SORT_POOL_BY.INTEREST_RATE}
                title='Interest Rate'
              />
              <BtnSortPool
                type={SORT_POOL_BY.DELEVERAGE_RISK}
                title='Deleverage Risk'
              />
            </div>
          </div>
        </Box>
      </div>
    </Modal>
  )
}

const BtnSortPool = ({ type, title }: any) => {
  const { settings, setSortPoolBuy } = useSettings()
  return <span
    onClick={() => { setSortPoolBuy(type) }}
    className={`sort-by__item ${settings.sortPoolBy === type && 'active'}`}
  >{title}</span>
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
    if ((!min || slippageState >= min) && (!max || slippageState <= max)) {
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
