import React from 'react'
import { Card } from '../ui/Card'
import { Text, TextBuy, TextGrey, TextSell } from '../ui/Text'
import './style.scss'
import { Box } from '../ui/Box'
import { Label } from '../ui/Label'
import { ButtonBuy, ButtonExecute, ButtonGrey } from '../ui/Button'
import 'rc-slider/assets/index.css'
import Slider from 'rc-slider'
import { IconArrowDown, IconArrowLeft } from '../ui/Icon'

const marks = {
  0: '-x8',
  25: '-x4',
  50: '0',
  75: 'x4',
  100: 'x8'
}

export const SwapBox = () => {
  return (
    <Card className='swap-box'>
      <div className='text-center'>
        <Text>ETH/USDT</Text>
        <TextBuy>(+32 USDT) (+5%)</TextBuy>
      </div>
      <Box borderColor='#4FBF67' className='info-box'>
        <div className='info-box__row'>
          <Label background='#3DBAA250'>
            <TextBuy>Long x25</TextBuy>
          </Label>
          <span>
            <IconArrowDown />
          </span>

          <Label background='#FF7A6850'>
            <TextSell>Short x -1.5</TextSell>
          </Label>
        </div>
        <div className='info-box__row'>
          <Label background='#3DBAA250'>
            <TextBuy>Long x25</TextBuy>
          </Label>
          <span>
            <IconArrowDown />
          </span>
          <Label background='#FF7A6850'>
            <TextSell>Short x -1.5</TextSell>
          </Label>
        </div>
        <div className='info-box__row'>
          <Label background='#3DBAA250'>
            <TextBuy>Long x25</TextBuy>
          </Label>
          <span>
            <IconArrowDown />
          </span>

          <Label background='#FF7A6850'>
            <TextSell>Short x -1.5</TextSell>
          </Label>
        </div>
      </Box>

      <div className='add-and-remove-box'>
        <ButtonBuy>Add</ButtonBuy>
        <ButtonGrey>Remove</ButtonGrey>
      </div>

      <div className='mt-2 mb-4 p-1'>
        <Slider
          range
          defaultValue={[0, 50, 75]}
          marks={marks}
          trackStyle={[
            { backgroundColor: '#FF7A68' },
            { backgroundColor: '#4FBF67' }
          ]}
          railStyle={{ backgroundColor: '#303236' }}
        />
      </div>

      <Box borderColor='#3a3a3a' className='info-box1 mb-2'>
        <InfoRow>
          <Text>Leverage</Text>
          <span>
            <TextBuy className='mr-05'>x2.5</TextBuy>
            <Text className='mr-05'> &gt; </Text>
            <TextSell>x0</TextSell>
          </span>
        </InfoRow>
        <InfoRow>
          <Text>DDL fees</Text>
          <span>
            <Text className='mr-05'>x2.5</Text>
            <TextGrey>USD</TextGrey>
          </span>
        </InfoRow>
        <InfoRow>
          <Text>fees</Text>
          <span>
            <Text className='mr-05'>0.01</Text>
            <Text className='mr-05'> BNB </Text>
            <Text className='mr-05'>= 0.1</Text>
            <Text className='mr-05'>USDT</Text>
            <Text>(0.05%)</Text>
          </span>
        </InfoRow>
      </Box>

      <Box borderColor='#3a3a3a' className='info-box1 '>
        <InfoRow>
          <span>
            <Text>0.3 </Text>
            <TextGrey>Eth^3</TextGrey>
          </span>
          <IconArrowLeft />
          <span>
            <Text>0.5 </Text>
            <TextGrey>Eth^-3</TextGrey>
          </span>
        </InfoRow>
        <InfoRow>
          <span>
            <Text>100 </Text>
            <TextGrey>BNB</TextGrey>
          </span>
          <IconArrowLeft />
          <span>
            <Text>900 </Text>
            <TextGrey>USDT</TextGrey>
          </span>
        </InfoRow>
      </Box>

      <div>
        <ButtonExecute className='execute-button'>Execute</ButtonExecute>
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
