import React, { useEffect, useMemo, useState } from 'react'
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
import { bn, numberToWei, weiToNumber } from '../../utils/helpers'
import { useWalletBalance } from '../../state/wallet/hooks/useBalances'
import { useListTokens } from '../../state/token/hook'
import { BigNumber, ethers } from 'ethers'
import { lowerFirst } from 'lodash'
import ERC20Abi from '../../assets/abi/IERC20.json'
import { LARGE_VALUE } from '../../utils/constant'
import { useWeb3React } from '../../state/customWeb3React/hook'
import { useConfigs } from '../../state/config/useConfigs'
import { useContract } from '../../hooks/useContract'

export const ExposureBox = () => {
  const [formAddOrRemove, setFormAddOrRemove] = useState<'add' | 'remove' | undefined>(undefined)
  const [newLeverage, setNewLeverage] = useState<number>(0)
  const [newValue, setNewValue] = useState<BigNumber>()
  const { account, library } = useWeb3React()
  const { configs } = useConfigs()
  const { dTokens, cToken, states, powers, baseToken, quoteToken, getTokenByPower } = useCurrentPool()
  const { balances, routerAllowances } = useWalletBalance()
  const [balanceInPool, setBalancesInPool] = useState<any>({})
  const [newBalancesInPool, setNewBalancesInPool] = useState<any>({})
  const [cAmountToChange, setCAmountToChange] = useState<string>('')
  const [swapSteps, setSwapsteps] = useState<any>([])
  const { getRouterContract } = useContract()
  const changedIn24h = -5
  const { tokens } = useListTokens()

  const resetFormHandle = () => {
    setFormAddOrRemove(undefined)
    setNewLeverage(oldLeverage)
  }

  const [powerState, oldLeverage, oldValue, marks, exposures] = useMemo(() => {
    let oldLeverage = 0
    let oldValue = bn(0)
    const p = new PowerState({ powers: [...powers] })
    if (powers && states.baseTWAP) {
      p.loadStates(states)
      const currentBalances = {}
      powers.forEach((power, key) => {
        if (balances[dTokens[key]]) {
          currentBalances[power] = bn(balances[dTokens[key]])
        }
      })
      setBalancesInPool(currentBalances)
      if (Object.keys(currentBalances).length > 0) {
        oldLeverage = Math.floor(p.calculateCompExposure(currentBalances) * 10) / 10
        oldValue = p.calculateCompValue(currentBalances)
      }

      setNewLeverage(oldLeverage)
      return [p, oldLeverage, oldValue, p.getMarks(), p.getExposures()]
    }
    return [null, 0, oldValue, {}, []]
  }, [powers, states, balances])

  const tokenNeedApprove = useMemo(() => {
    const result: string[] = []
    for (const i in swapSteps) {
      const stepToToken = getTokenByPower(Number(Object.keys(swapSteps[i].from)[0]))
      if ((!routerAllowances[stepToToken] || routerAllowances[stepToToken].isZero()) && !result.includes(stepToToken)) {
        result.push(stepToToken)
      }
    }
    return result
  }, [swapSteps])

  useEffect(() => {
    try {
      if (powerState) {
        const value = powerState.calculateCompValue(balanceInPool)
        setNewValue(value)
        const newBalancesInPool = powerState.getOptimalBalances(bn(value), newLeverage)
        console.log(newLeverage, newBalancesInPool)
        setNewBalancesInPool(newBalancesInPool)
        const steps = powerState.getSwapSteps(balanceInPool, newBalancesInPool)
        setSwapsteps(steps)
      }
    } catch (e) {
      console.log(e)
    }
  }, [newLeverage, powerState, cAmountToChange])

  return (
    <Card className='exposure-box'>
      <div className='text-center'>
        <Text>{tokens[baseToken]?.symbol}/{tokens[quoteToken]?.symbol}</Text>
        <TextBuy>(+32 {tokens[quoteToken]?.symbol}) (+5%)</TextBuy>
      </div>
      <LeverageChangedInfoBox
        oldLeverage={oldLeverage}
        oldValue={oldValue}
        newLeverage={newLeverage}
        newValue={newValue}
        changedIn24h={changedIn24h}
      />

      {formAddOrRemove && (
        <div className='amount-input-box'>
          <div className='amount-input-box__head'>
            <span>{tokens[cToken]?.symbol}_{tokens[baseToken]?.symbol}_{tokens[quoteToken]?.symbol}</span>
            <Text>Balance: {weiToNumber(balances[cToken], tokens[cToken]?.decimal || 18, 4)}</Text>
          </div>
          <Input
            // @ts-ignore
            value={cAmountToChange}
            onChange={(e) => {
              setCAmountToChange((e.target as HTMLInputElement).value)
            }}
            placeholder='0.0'
            suffix='$0'
            className='fs-24'
          />
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
          min={Math.min(...exposures)}
          max={Math.max(...exposures)}
          step={0.1}
          defaultValue={[Math.min(...exposures), oldLeverage, newLeverage]}
          value={[Math.min(...exposures),
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

      {
        swapSteps.length > 0 &&
        <Box borderColor='#3a3a3a' className='info-box1 ' title='Transactions Info'>
          {swapSteps.map((step: any, key: any) => {
            const stepFromToken = getTokenByPower(Number(Object.keys(step.from)[0]))
            const stepToToken = getTokenByPower(Number(Object.keys(step.to)[0]))
            const stepFromAmount = Object.values(step.from)
            const stepToAmount = Object.values(step.to)
            return <InfoRow key={key}>
              <span>
                {/* <Text>{weiToNumber(stepFromAmount, tokens[stepFromToken]?.decimal || 18, 4)}</Text> */}
                <Text>{stepFromAmount.toString()}</Text>
                <TextGrey>{tokens[stepFromToken]?.symbol}</TextGrey>
              </span>
              <IconArrowLeft />
              <span>
                {/* <Text>{weiToNumber(stepToAmount, tokens[stepToToken]?.decimal || 18, 4)}</Text> */}
                <Text>{stepToAmount.toString()}</Text>
                <TextGrey>{tokens[stepToToken]?.symbol}</TextGrey>
              </span>
            </InfoRow>
          })
          }
        </Box>
      }

      <div className='jc-space-between'>
        {
          tokenNeedApprove.length > 0
            ? <ButtonExecute
              onClick={async () => {
                const signer = library.getSigner()

                for (const i in tokenNeedApprove) {
                  console.log(tokenNeedApprove[i])
                  const contract = new ethers.Contract(tokenNeedApprove[i], ERC20Abi, signer)
                  await contract.approve(configs.addresses.router, LARGE_VALUE)
                }
              }}
              className='execute-button mr-1'
            >Approve</ButtonExecute>

            : <ButtonExecute
              onClick={async () => {
                const signer = library.getSigner()
                const contract = getRouterContract(signer)
                const steps = []
                for (const i in swapSteps) {
                  const swapStep = swapSteps[i]
                  const tokenOut = getTokenByPower(Number(Object.keys(swapStep.to)[0]))
                  const tokenIn = getTokenByPower(Number(Object.keys(swapStep.from)[0]))
                  steps.push({
                    tokenIn,
                    tokenOut,
                    amountIn: Object.values(swapStep.from)[0],
                    amountOutMin: 0
                  })
                }
                console.log(steps)
                const res = await contract.callStatic.multiSwap(
                  configs.addresses.pool,
                  steps,
                  account,
                  new Date().getTime() + 3600000
                )
                console.log(res)
              }}
              className='execute-button mr-1'
            >Execute</ButtonExecute>
        }

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

const LeverageChangedInfoBox = ({
  oldLeverage,
  newLeverage,
  oldValue,
  newValue,
  changedIn24h
}: any) => {
  const { quoteToken } = useCurrentPool()
  const { tokens } = useListTokens()
  const OldLabel = oldLeverage < 0 ? LabelSell : LabelBuy
  const OldText = oldLeverage < 0 ? TextSell : TextBuy
  const NewLabel = newLeverage < 0 ? LabelSell : LabelBuy
  const NewText = newLeverage < 0 ? TextSell : TextBuy
  const OldChangedIn24hLabel = changedIn24h * oldLeverage < 0 ? LabelSell : LabelBuy
  const OldChangedIn24hText = changedIn24h * oldLeverage < 0 ? TextSell : TextBuy
  const NewChangedIn24hLabel = changedIn24h * newLeverage < 0 ? LabelSell : LabelBuy
  const NewChangedIn24hText = changedIn24h * newLeverage < 0 ? TextSell : TextBuy

  return <Box borderColor='#4FBF67' className='leverage-changed-box'>
    <div className={`leverage-changed-box__row ${oldLeverage !== newLeverage && 'is-changed'}`}>
      <OldLabel>
        <OldText>{oldLeverage > 0 ? 'Long' : 'Short'} x{Math.abs(oldLeverage)}</OldText>
      </OldLabel>
      {
        oldLeverage !== newLeverage &&
        <React.Fragment>
          <span>
            <IconArrowDown />
          </span>

          <NewLabel>
            <NewText>{newLeverage > 0 ? 'Long' : 'Short'} x{Math.abs(newLeverage)}</NewText>
          </NewLabel>
        </React.Fragment>
      }

    </div>
    <div className={`leverage-changed-box__row ${oldLeverage !== newLeverage && 'is-changed'}`}>
      <LabelGreen>
        <TextGreen>{weiToNumber(oldValue, tokens[quoteToken]?.decimal || 18, 4)} {tokens[quoteToken]?.symbol}</TextGreen>
      </LabelGreen>
      {
        oldLeverage !== newLeverage &&
        <React.Fragment>
          <span>
            <IconArrowDown />
          </span>

          <LabelGreen>
            <TextGreen>{weiToNumber(newValue, tokens[quoteToken]?.decimal || 18, 4)} {tokens[quoteToken]?.symbol}</TextGreen>
          </LabelGreen>
        </React.Fragment>
      }
    </div>
    <div className={`leverage-changed-box__row ${oldLeverage !== newLeverage && 'is-changed'}`}>
      <OldChangedIn24hLabel>
        <OldChangedIn24hText>{changedIn24h * oldLeverage}%</OldChangedIn24hText>
      </OldChangedIn24hLabel>
      {
        oldLeverage !== newLeverage &&
        <React.Fragment>
          <span>
            <IconArrowDown />
          </span>
          <NewChangedIn24hLabel>
            <NewChangedIn24hText>{changedIn24h * newLeverage}%</NewChangedIn24hText>
          </NewChangedIn24hLabel>
        </React.Fragment>
      }
    </div>
  </Box>
}
