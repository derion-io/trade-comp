import React from 'react'
import { Card } from '../ui/Card'
import { Text, TextBuy, TextGrey, TextSell } from '../ui/Text'
import './style.scss'
import { Box } from '../ui/Box'
import { Label } from '../ui/Label'
import { ButtonBuy, ButtonExecute, ButtonGrey } from '../ui/Button'
import 'rc-slider/assets/index.css'
import Slider from 'rc-slider'

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
          <span>arrow</span>

          <Label background='#FF7A6850'>
            <TextSell>Short x -1.5</TextSell>
          </Label>
        </div>
        <div className='info-box__row'>
          <Label background='#3DBAA250'>
            <TextBuy>Long x25</TextBuy>
          </Label>
          <span>arrow</span>
          <Label background='#FF7A6850'>
            <TextSell>Short x -1.5</TextSell>
          </Label>
        </div>
        <div className='info-box__row'>
          <Label background='#3DBAA250'>
            <TextBuy>Long x25</TextBuy>
          </Label>
          <span>arrow</span>

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
        <InfoRow
          label='Leverage'
          value={
            <span>
              <TextBuy className='mr-05'>x2.5</TextBuy>
              <Text className='mr-05'> &gt; </Text>
              <TextSell>x0</TextSell>
            </span>
          }
        />
        <InfoRow
          label='DDL fees'
          value={
            <span>
              <Text className='mr-05'>x2.5</Text>
              <TextGrey>USD</TextGrey>
            </span>
          }
        />
        <InfoRow
          label='TX fees'
          value={
            <span>
              <Text className='mr-05'>0.01</Text>
              <Text className='mr-05'> BNB </Text>
              <Text className='mr-05'>= 0.1</Text>
              <Text className='mr-05'>USDT</Text>
              <Text>(0.05%)</Text>
            </span>
          }
        />
      </Box>

      <Box borderColor='#3a3a3a' className='info-box1 '>
        <InfoRow
          label='Leverage'
          value={
            <span>
              <TextBuy className='mr-05'>x2.5</TextBuy>
              <Text className='mr-05'> &gt; </Text>
              <TextSell>x0</TextSell>
            </span>
          }
        />
        <InfoRow
          label='DDL fees'
          value={
            <span>
              <Text className='mr-05'>x2.5</Text>
              <TextGrey>USD</TextGrey>
            </span>
          }
        />
        <InfoRow
          label='TX fees'
          value={
            <span>
              <Text className='mr-05'>0.01</Text>
              <TextGrey className='mr-05'> BNB </TextGrey>
              <Text className='mr-05'>= 0.1</Text>
              <TextGrey className='mr-05'>USDT</TextGrey>
              <TextBuy>(0.05%)</TextBuy>
            </span>
          }
        />
      </Box>

      <div>
        <ButtonExecute className='execute-button'>Execute</ButtonExecute>
      </div>
    </Card>
  )
}

const InfoRow = (props: any) => {
  return (
    <div className={'d-flex jc-space-between info-row font-size-12 ' + props.className}>
      {props.label}
      {props.value}
    </div>
  )
}
