import React, { useEffect, useState } from 'react'
import { Card } from '../ui/Card'
import { Text, TextBuy, TextGreen, TextGrey, TextSell } from '../ui/Text'
import './style.scss'
import { Box } from '../ui/Box'
import { LabelBuy, LabelGreen, LabelSell } from '../ui/Label'
import { ButtonBuy, ButtonExecute, ButtonGrey, ButtonReset } from '../ui/Button'
import 'rc-slider/assets/index.css'
import Slider from 'rc-slider'
import { IconArrowDown, IconArrowLeft } from '../ui/Icon'
import { Input } from '../ui/Input'
import { useCurrentPool } from '../../state/currentPool/hooks/useCurrentPool'
import { PowerState } from '../../utils/powerLib'
import { bn, numberToWei } from '../../utils/helpers'
import { useWeb3React } from '../../state/customWeb3React/hook'
import { utils } from 'ethers'

const marks = {
  0: '-32',
  28: '-4',
  32: '0',
  36: '4',
  64: '32'
}

export const ExposureBox = () => {
  const oldLeverage = 50
  const [formAddOrRemove, setFormAddOrRemove] = useState<'add' | 'remove' | undefined>(undefined)
  const [newLeverage, setNewLeverage] = useState<number>(oldLeverage)
  const { dTokens, states } = useCurrentPool()

  const resetFormHandle = () => {
    setFormAddOrRemove(undefined)
    setNewLeverage(oldLeverage)
  }

  useEffect(() => {
    const id = utils.id('LogicCreated(address,bytes32,address,bytes32,bytes32,uint224,uint224,int256[])')
    console.log('topic', id)

    if (states.baseTWAP) {
      const powerState = new PowerState({})
      powerState.loadStates(states)
      console.log(states)
      const balances = powerState.getOptimalBalances(bn(numberToWei('100')), 3.14159)
      // const a = powerState.calculateExposure(8)/
      const E = powerState.calculateCompExposure(balances)
      console.log(E)
      console.log(balances)
    }
  }, [newLeverage, states])

  return (
    <Card className='exposure-box'>
      <div className='text-center'>
        <Text>ETH/USDT</Text>
        <TextBuy>(+32 USDT) (+5%)</TextBuy>
      </div>
      <LeverageChangedInfoBox oldLeverage={oldLeverage} newLeverage={newLeverage} />

      {formAddOrRemove && (
        <div className='amount-input-box'>
          <div className='amount-input-box__head'>
            <span>BNB</span>
            <Text>Balance: 1234</Text>
          </div>
          <Input placeholder='0.0' suffix='$0' className='fs-24' />
        </div>
      )}

      {
        !formAddOrRemove &&
        <div className='add-and-remove-box'>
          <ButtonBuy onClick={() => {
            setFormAddOrRemove('add')
          }}>
            Add
          </ButtonBuy>
          <ButtonGrey onClick={() => {
            setFormAddOrRemove('remove')
          }}>
            Remove
          </ButtonGrey>
        </div>
      }

      <div className='mt-2 mb-4 p-1'>
        <Slider
          range
          min={0}
          max={64}
          defaultValue={[0, oldLeverage, newLeverage]}
          value={[0,
            newLeverage <= oldLeverage ? newLeverage : oldLeverage,
            newLeverage <= oldLeverage ? oldLeverage : newLeverage
          ]}
          marks={marks}
          trackStyle={[
            { backgroundColor: '#FF7A68', height: '2px' },
            { backgroundColor: '#4FBF67', height: '2px', color: '#303236', border: '1px dashed' }
          ]}
          railStyle={{ backgroundColor: '#303236' }}
          onChange={(e) => {
            // @ts-ignore
            setNewLeverage(e[e.length - 1] === oldLeverage ? e[e.length - 2] : e[e.length - 1])
          }}
        />
      </div>

      <Box borderColor='#3a3a3a' className='info-box1 mb-2' title='Swaps'>
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

      <Box borderColor='#3a3a3a' className='info-box1 ' title='Transactions Info'>
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

      <div className='jc-space-between'>
        <ButtonExecute className='execute-button mr-1'>Execute</ButtonExecute>
        <ButtonReset className='execute-button' onClick={resetFormHandle}>Reset</ButtonReset>
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

const LeverageChangedInfoBox = ({ oldLeverage, newLeverage }: any) => {
  const OldLabel = oldLeverage < 50 ? LabelSell : LabelBuy
  const OldText = oldLeverage < 50 ? TextSell : TextBuy
  const NewLabel = newLeverage < 50 ? LabelSell : LabelBuy
  const NewText = newLeverage < 50 ? TextSell : TextBuy

  return <Box borderColor='#4FBF67' className='leverage-changed-box'>
    <div className={`leverage-changed-box__row ${oldLeverage !== newLeverage && 'is-changed'}`}>
      <OldLabel>
        <OldText>Long x25</OldText>
      </OldLabel>
      {
        oldLeverage !== newLeverage &&
        <React.Fragment>
          <span>
            <IconArrowDown />
          </span>

          <NewLabel>
            <NewText>Short x -1.5</NewText>
          </NewLabel>
        </React.Fragment>
      }

    </div>
    <div className={`leverage-changed-box__row ${oldLeverage !== newLeverage && 'is-changed'}`}>
      <LabelGreen>
        <TextGreen>17290 USDT</TextGreen>
      </LabelGreen>
      {
        oldLeverage !== newLeverage &&
        <React.Fragment>
          <span>
            <IconArrowDown />
          </span>

          <LabelGreen>
            <TextGreen>17290 USDT</TextGreen>
          </LabelGreen>
        </React.Fragment>
      }
    </div>
    <div className={`leverage-changed-box__row ${oldLeverage !== newLeverage && 'is-changed'}`}>
      <OldLabel>
        <OldText>Long x25</OldText>
      </OldLabel>
      {
        oldLeverage !== newLeverage &&
        <React.Fragment>
          <span>
            <IconArrowDown />
          </span>

          <NewLabel>
            <NewText>Short x -1.5</NewText>
          </NewLabel>
        </React.Fragment>
      }
    </div>
  </Box>
}
