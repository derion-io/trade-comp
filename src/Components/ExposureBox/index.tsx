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
import { PowerState, StepType } from '../../utils/powerLib'
import { bn, formatFloat, numberToWei, parseCallStaticError, weiToNumber } from '../../utils/helpers'
import { useWalletBalance } from '../../state/wallet/hooks/useBalances'
import { useListTokens } from '../../state/token/hook'
import { BigNumber } from 'ethers'
import { useWeb3React } from '../../state/customWeb3React/hook'
import { UseExposureAction } from '../../hooks/useExposureAction'
import { toast } from 'react-toastify'
import { TokenSymbol } from '../ui/TokenSymbol'

export const ExposureBox = () => {
  const [formAddOrRemove, setFormAddOrRemove] = useState<'add' | 'remove' | undefined>(undefined)
  const [newLeverage, setNewLeverage] = useState<number>(0)
  const [newValue, setNewValue] = useState<BigNumber>()
  const { account } = useWeb3React()
  const [loading, setLoading] = useState<boolean>(false)
  const { dTokens, cToken, states, powers, baseToken, quoteToken, cTokenPrice, getTokenByPower } = useCurrentPool()
  const { balances, routerAllowances, approveRouter, fetchBalanceAndAllowance } = useWalletBalance()
  const [balanceInPool, setBalancesInPool] = useState<any>({})
  const [newBalancesInPool, setNewBalancesInPool] = useState<any>({})
  const [cAmountToChange, setCAmountToChange] = useState<string>('')
  const [swapSteps, setSwapsteps] = useState<any>([])
  const changedIn24h = -5
  const { tokens } = useListTokens()
  const { calculateAmountOuts, updateLeverageAndSize } = UseExposureAction()
  const [stepsWithAmounts, setStepsWithAmounts] = useState<(StepType & { amountOut: BigNumber })[]>([])

  const resetFormHandle = () => {
    setCAmountToChange('')
    setFormAddOrRemove(undefined)
    setNewLeverage(oldLeverage)
  }

  const [powerState, oldLeverage, oldValue, marks, exposures] = useMemo(() => {
    let oldLeverage = 0
    let oldValue = bn(0)
    const p = new PowerState({ powers: [...powers] })
    if (powers && states.baseTWAP) {
      p.loadStates(states, cTokenPrice)
      const currentBalances = {}
      powers.forEach((power, key) => {
        if (balances[dTokens[key]]) {
          currentBalances[power] = bn(balances[dTokens[key]])
        }
      })
      setBalancesInPool(currentBalances)
      if (Object.keys(currentBalances).length > 0) {
        oldLeverage = p.calculateCompExposure(currentBalances)
        oldValue = p.calculateCompValue(currentBalances)
      }

      setNewLeverage(oldLeverage)
      const exposure = p.getExposures()
      return [p, oldLeverage, oldValue, p.getMarks(), exposure]
    }
    return [null, 0, oldValue, {}, []]
  }, [powers, states, balances])

  const tokenNeedApprove = useMemo(() => {
    const result: string[] = []
    for (const i in swapSteps) {
      const stepToToken = getTokenByPower(swapSteps[i].tokenIn)
      if ((!routerAllowances[stepToToken] || routerAllowances[stepToToken].isZero()) && !result.includes(stepToToken)) {
        result.push(stepToToken)
      }
    }
    return result
  }, [swapSteps, routerAllowances])

  /**
   * calculate raw steps to change leverage and size
   */
  useEffect(() => {
    try {
      console.log('cAmountToChange', cAmountToChange)
      if (powerState) {
        let value = powerState.calculateCompValue(balanceInPool)
        if (cAmountToChange) {
          const cPrice = powerState.getCPrice()
          const cTokenValue = bn(numberToWei(cAmountToChange, tokens[cToken]?.decimal || 18)).mul(numberToWei(cPrice)).div(numberToWei(1))
          if (formAddOrRemove === 'add') {
            value = value.add(cTokenValue)
          } else if (formAddOrRemove === 'remove') {
            value = value.sub(cTokenValue)
          }
        }

        setNewValue(value)
        const newBalancesInPool = powerState.getOptimalBalances(bn(value), newLeverage)

        setNewBalancesInPool(newBalancesInPool)
        const steps = powerState.getSwapSteps(balanceInPool, newBalancesInPool)
        setSwapsteps(steps.filter((step) => step.amountIn.gt(0)))
      }
    } catch (e) {
      console.log(e)
    }
  }, [oldLeverage, newLeverage, powerState, cAmountToChange])

  useEffect(() => {
    // const delayDebounceFn = setTimeout(() => {
    calculateAmountOuts(swapSteps, setStepsWithAmounts)
    // console.log('res')
    // setStepsWithAmounts(res)
    // }, 3000)
    // return () => {
    //   clearTimeout(delayDebounceFn)
    // }
  }, [swapSteps])

  const renderExecuteButton = () => {
    if (!tokens[cToken] || loading) {
      // @ts-ignore
      return <ButtonExecute className='execute-button mr-1' disabled>Loading...</ButtonExecute>
    } else if (!account) {
      // @ts-ignore
      return <ButtonExecute className='execute-button mr-1' disabled>Connect wallet</ButtonExecute>
    } else if (tokenNeedApprove.length > 0) {
      return <ButtonExecute
        onClick={async () => {
          for (const i in tokenNeedApprove) {
            approveRouter({ tokenAddress: tokenNeedApprove[i] })
          }
        }}
        className='execute-button mr-1'
      >Approve</ButtonExecute>
    } else {
      return <ButtonExecute
        onClick={async () => {
          setLoading(true)
          try {
            await updateLeverageAndSize(swapSteps)
            await fetchBalanceAndAllowance(Object.keys(tokens))
          } catch (e) {
            toast(parseCallStaticError(e))
          }

          setLoading(true)
        }}
        className='execute-button mr-1'
      >Execute</ButtonExecute>
    }
  }

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
          onChange={(e:number[]) => {
            setNewLeverage(formatFloat(e[e.length - 1], 1) === formatFloat(oldLeverage, 1)
              ? formatFloat(e[e.length - 2], 1)
              : formatFloat(e[e.length - 1], 1)
            )
          }}
        />
      </div>

      {
        swapSteps.length > 0 && (newLeverage !== oldLeverage || cAmountToChange) &&
        <Box borderColor='#3a3a3a' className='info-box1 ' title='Transactions Info'>
          {swapSteps.map((step: any, key: any) => {
            const stepFromToken = getTokenByPower(step.tokenIn)
            const stepToToken = getTokenByPower(step.tokenOut)
            const amountIn = step.amountIn
            const amountOut = stepsWithAmounts && stepsWithAmounts[key]?.amountOut ? stepsWithAmounts[key].amountOut : '...'
            if (amountIn.lte(1000)) {
              return ''
            }
            return <InfoRow key={key}>
              <span>
                <Text>{weiToNumber(amountIn, tokens[stepFromToken]?.decimal || 18, 4)}</Text>
                <TextGrey> <TokenSymbol token={tokens[stepFromToken]}/></TextGrey>
              </span>
              <IconArrowLeft />
              <span>
                <Text>{weiToNumber(amountOut, tokens[stepToToken]?.decimal || 18, 4)} </Text>
                <TextGrey> <TokenSymbol token={tokens[stepToToken]}/></TextGrey>
              </span>
            </InfoRow>
          })
          }
        </Box>
      }

      <Box borderColor='#3a3a3a' className='info-box1 mb-2' title='Swaps'>
        <InfoRow>
          <Text>Leverage</Text>
          <span>
            <TextBuy className='mr-05'>x{formatFloat(oldLeverage)}</TextBuy>
            <Text className='mr-05'> &gt; </Text>
            <TextSell>x{formatFloat(newLeverage)}</TextSell>
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

      <div className='jc-space-between'>
        {renderExecuteButton()}
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
        <OldText>{oldLeverage > 0 ? 'Long' : 'Short'} x{Math.abs(formatFloat(oldLeverage))}</OldText>
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
        <OldChangedIn24hText>{changedIn24h * formatFloat(oldLeverage)}%</OldChangedIn24hText>
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
