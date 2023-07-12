import React from 'react'
import './style.scss'
import isEqual from 'react-fast-compare'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Text } from '../ui/Text'
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
        <div className='info-row'>
          <Text>Slippage Tolerance</Text>
          <Input
            value={settings.slippage}
            onChange={(e) => {
              setSlippage(Number(e.target.value))
            }}
            suffix='%'
          />
        </div>
        <div className='info-row'>
          <Text>Payoff Tolerance</Text>
          <Input
            value={settings.payoffMinRate}
            onChange={(e) => {
              setPayoffMinRate(Number(e.target.value))
            }}
            suffix='%'
          />
        </div>
        <div className='info-row'>
          <Text>Pool Filter: </Text>
        </div>
        <Box borderColor='default p-1'>
          <div className='info-row'>
            <Text>Min Interest Rate:</Text>
            <Input
              value={settings.minInterestRate}
              onChange={(e) => {
                setMinInterestRate(Number(e.target.value))
              }}
              suffix='%'
            />
          </div>
          <div className='info-row'>
            <Text>Min Liquidity:</Text>
            <Input
              value={settings.minLiquidity}
              onChange={(e) => {
                setMinLiquidity(Number(e.target.value))
              }}
              suffix='%'
            />
          </div>
          <div className='info-row'>
            <Text>Max Deleverage Risk:</Text>
            <Input
              value={settings.deleverageChance}
              onChange={(e) => {
                setDeleverageChance(Number(e.target.value))
              }}
              suffix='%'
            />
          </div>
        </Box>
      </div>
    </Modal>
  )
}

export const SettingModal = React.memo(Component, (prevProps, nextProps) =>
  isEqual(prevProps, nextProps)
)
