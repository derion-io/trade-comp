import React from 'react'
import { Card } from '../ui/Card'
import { Text, TextGrey } from '../ui/Text'
import './style.scss'
import { Box } from '../ui/Box'
import { ButtonExecute } from '../ui/Button'
import 'rc-slider/assets/index.css'
import { IconArrowDown, IconArrowLeft, IconOptionLeft } from '../ui/Icon'
import { Input } from '../ui/Input'
import { TokenIcon } from '../ui/TokenIcon'

export const SwapBox = () => {
  return (
    <Card className='swap-box'>
      <div className='d-flex jc-space-between'>
        <Text>Swap</Text>
        <span><IconOptionLeft /></span>
      </div>

      <div className='amount-input-box'>
        <div className='amount-input-box__head'>
          <span className='current-token'>
            <TokenIcon size={24} tokenAddress='0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c' />
            <Text>BNB</Text>
          </span>
          <Text>Balance: 1234</Text>
        </div>
        <Input placeholder='0.0' suffix='$0' className='fs-24' />
      </div>

      <div className='text-center mt-2 mb-1'>
        <span className='arrow-down'>
          <IconArrowDown fill='#01A7FA' />
        </span>
      </div>

      <div className='amount-input-box'>
        <div className='amount-input-box__head'>
          <span className='current-token'>
            <TokenIcon size={24} tokenAddress='0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c' />
            <Text>BNB</Text>
          </span>
          <Text>Balance: 1234</Text>
        </div>
        <Input placeholder='0.0' suffix='$0' className='fs-24' />
      </div>

      <Box borderColor='#3a3a3a' className='swap-info-box mt-2 mb-2'>
        <Box
          borderColor='#3a3a3a'
          borderRadius='0'
          disableBorderLeft
          disableBorderRight
          disableBorderTop
        >
          <InfoRow className='mb-2'>
            <span>
              <Text>Est fees</Text>
            </span>
            <span>
              <Text>32 </Text>
              <TextGrey>USDT</TextGrey>
            </span>
          </InfoRow>
          <InfoRow className='mb-2'>
            <span>
              <Text>Slippage</Text>
            </span>
            <span>
              <TextGrey>0.5%</TextGrey>
            </span>
          </InfoRow>
          <InfoRow className='mb-1'>
            <span>
              <Text>Price Impact</Text>
            </span>
            <span>
              <TextGrey>-0.01%</TextGrey>
            </span>
          </InfoRow>
        </Box>
        <Box>
          <InfoRow className='mt-1'>
            <span>
              <TextGrey>Minimum received</TextGrey>
            </span>
            <span>
              <Text>14.2815 ETH</Text>
            </span>
          </InfoRow>
        </Box>
      </Box>

      <div>
        <ButtonExecute className='swap-button'>Swap</ButtonExecute>
      </div>
    </Card>
  )
}

const InfoRow = (props: any) => {
  return (
    <div
      className={
        'd-flex jc-space-between info-row font-size-12 ' + props.className
      }
    >
      {props.children}
    </div>
  )
}
