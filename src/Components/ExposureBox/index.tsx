import React, { useEffect, useMemo, useState } from 'react'
import { Card } from '../ui/Card'
import { Text, TextBlue, TextBuy, TextGreen, TextGrey, TextPink, TextSell } from '../ui/Text'
import './style.scss'
import { Box } from '../ui/Box'
import { LabelBuy, LabelGreen, LabelSell } from '../ui/Label'
import { Button, ButtonBuy, ButtonExecute, ButtonGrey, ButtonReset } from '../ui/Button'
import 'rc-slider/assets/index.css'
import Slider from 'rc-slider'
import { IconArrowDown, IconArrowLeft, IconArrowRight } from '../ui/Icon'
import { Input } from '../ui/Input'
import { useCurrentPool } from '../../state/currentPool/hooks/useCurrentPool'
import { PowerState, StepType } from 'powerLib'
import {
  bn,
  decodeErc1155Address,
  formatFloat,
  mul,
  numberToWei,
  parseCallStaticError, parseUq112x112,
  weiToNumber
} from '../../utils/helpers'
import { useWalletBalance } from '../../state/wallet/hooks/useBalances'
import { useListTokens } from '../../state/token/hook'
import { BigNumber, ethers } from 'ethers'
import { useWeb3React } from '../../state/customWeb3React/hook'
import { useMultiSwapAction } from '../../hooks/useMultiSwapAction'
import { toast } from 'react-toastify'
import { TokenSymbol } from '../ui/TokenSymbol'
import { SkeletonLoader } from '../ui/SkeletonLoader'
import { POOL_IDS } from '../../utils/constant'
import { LeverageChangedInfoBox } from './LeverageChangedInfoBox'
import { CustomSlider } from './CustomSlider'

const nativePrice = 300

export const ExposureBox = ({changedIn24h}: {
  changedIn24h: number
}) => {
  const [formAddOrRemove, setFormAddOrRemove] = useState<'add' | 'remove' | undefined>(undefined)
  const [newLeverage, setNewLeverage] = useState<number>(0)
  const [newValue, setNewValue] = useState<BigNumber>()
  const { account, showConnectModal } = useWeb3React()
  const [loading, setLoading] = useState<boolean>(false)
  const { dTokens, cToken, poolAddress, states, powers, baseToken, quoteToken, cTokenPrice, basePrice, getTokenByPower } = useCurrentPool()
  const { balances, routerAllowances, approveRouter, fetchBalanceAndAllowance } = useWalletBalance()
  const [balanceInPool, setBalancesInPool] = useState<any>({})
  const [cAmountToChange, setCAmountToChange] = useState<string>('')
  const [swapSteps, setSwapsteps] = useState<any>([])
  const [isDeleverage, setIsDeleverage] = useState<boolean>(false)
  const { tokens } = useListTokens()
  const { calculateAmountOuts, updateLeverageAndSize } = useMultiSwapAction()
  const [stepsWithAmounts, setStepsWithAmounts] = useState<(StepType & { amountOut: BigNumber })[]>([])
  const [callError, setCallError] = useState<string>('')
  const [leverageManual, setLeverageManual] = useState<boolean>(false)
  const [txFee, setTxFee] = useState<BigNumber>(bn(0))
  const [gasUsed, setGasUsed] = useState<BigNumber>(bn(0))

  const resetFormHandle = () => {
    setCAmountToChange('')
    setFormAddOrRemove(undefined)
    setNewLeverage(oldLeverage)
    setLoading(false)
  }

  const [powerState, oldLeverage, oldValue, marks, exposures] = useMemo(() => {
    let oldLeverage = 0
    let oldValue = bn(0)
    const p = new PowerState({ powers: [...powers] })
    if (powers && states.twapBase) {
      p.loadStates(states)
      const currentBalances = {}
      powers.forEach((power, key) => {
        if (balances[dTokens[key]] && balances[dTokens[key]].gt(0)) {
          currentBalances[power] = bn(balances[dTokens[key]])
        }
      })
      setBalancesInPool(currentBalances)
      if (Object.keys(currentBalances).length > 0) {
        oldLeverage = p.calculateCompExposure(currentBalances)
        oldValue = p.calculateCompValue(currentBalances)
      }

      if (newLeverage === 0 && oldLeverage !== 0) {
        setNewLeverage(oldLeverage)
      }
      const exposure = p.getExposures()
      const marks = p.getMarks()
      delete marks[0]
      return [p, oldLeverage, oldValue, marks, exposure]
    }
    return [null, 0, oldValue, {}, []]
  }, [powers, states, balances])

  const tokenNeedApprove = useMemo(() => {
    const result: string[] = []
    for (const i in swapSteps) {
      const tokenIn = decodeErc1155Address(getTokenByPower(swapSteps[i].tokenIn)).address
      if ((!routerAllowances[tokenIn] || routerAllowances[tokenIn].isZero()) && !result.includes(tokenIn)) {
        result.push(tokenIn)
      }
    }
    return result
  }, [swapSteps, routerAllowances])

  /**
   * calculate raw steps to change leverage and size
   */
  useEffect(() => {
    try {
      if (powerState) {
        let value = powerState.calculateCompValue(balanceInPool)
        let cAmount
        if (cAmountToChange) {
          const cPrice = powerState.getCPrice()
          cAmount = bn(numberToWei(cAmountToChange, tokens[cToken]?.decimal || 18))
          console.log('cAmountToChange', cAmountToChange, ethers.utils.formatEther(cAmount))
          if (formAddOrRemove === 'remove') {
            cAmount = bn(0).sub(cAmount)
          }
          const cTokenValue = cAmount.mul(numberToWei(cPrice)).div(numberToWei(1))
          value = value.add(cTokenValue)
        }

        setNewValue(value)

        const steps = powerState.getSwapSteps(balanceInPool, newLeverage, cAmount)
        setSwapsteps(steps.filter((step) => step.amountIn.gt(0)))
      }
    } catch (e) {
      console.log(e)
    }
  }, [oldLeverage, newLeverage, powerState, cAmountToChange])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setCallError('Calculating...')
      calculateAmountOuts(swapSteps, isDeleverage)
        .then(([aOuts, gasUsed]) => {
          // @ts-ignore
          setTxFee(detectTxFee(gasUsed))
          // @ts-ignore
          setGasUsed(gasUsed)
          // @ts-ignore
          setStepsWithAmounts(aOuts)
          setCallError('')
        })
        .catch((e) => {
          setStepsWithAmounts([])
          setTxFee(bn(0))
          setGasUsed(bn(0))
          const error = parseCallStaticError(e)
          if (error === 'deleverage') {
            setIsDeleverage(true)
          } else if (error === '!deleverage') {
            setIsDeleverage(false)
          }
          setCallError(error ?? e)
        })
    }, 3000)
    return () => {
      clearTimeout(delayDebounceFn)
    }
  }, [swapSteps, isDeleverage])

  const detectTxFee = (gasUsed: BigNumber) => {
    return gasUsed.mul(2).div(3).mul(5 * 10 ** 9)
  }

  const renderExecuteButton = () => {
    if (!tokens[cToken] || loading) {
      return <ButtonExecute className='execute-button mr-1' disabled>Loading...</ButtonExecute>
    } else if (!account) {
      return <ButtonExecute
        className='execute-button mr-1'
        onClick={() => {
          showConnectModal()
        }}
      >Connect wallet</ButtonExecute>
    } else if (tokenNeedApprove.length > 0) {
      return <ButtonExecute
        onClick={async () => {
          for (const i in tokenNeedApprove) {
            await approveRouter({ tokenAddress: tokenNeedApprove[i] })
          }
        }}
        className='execute-button mr-1'
      >Approve</ButtonExecute>
    } else if (callError) {
      return <ButtonExecute className='execute-button mr-1' disabled>{callError}</ButtonExecute>
    } else {
      return <ButtonExecute
        onClick={async () => {
          setLoading(true)
          try {
            await updateLeverageAndSize(swapSteps, isDeleverage)
            await fetchBalanceAndAllowance(Object.keys(tokens))
          } catch (e) {
            toast(parseCallStaticError(e))
          }
          setLoading(false)
        }}
        className='execute-button mr-1'
      >{isDeleverage && 'Deleverage & '}Execute</ButtonExecute>
    }
  }
  const [protocolFee, percent] = useMemo(() => {
    const fee = bn(0)
    let percent = 0
    for (const i in stepsWithAmounts) {
      const step = stepsWithAmounts[i]
      if (step.tokenIn === poolAddress + '-' + POOL_IDS.cp && step.tokenOut === cToken) {
        const cPrice = parseUq112x112(states.twapLP, 1000)
        fee.add(step.amountOut
          .mul(3)
          .mul(cPrice * 1000)
          .div(1000 * 1000))
        percent = 0.3
      }
    }
    return [formatFloat(weiToNumber(fee, tokens[cToken]?.decimal || 18), 2), percent]
  }, [stepsWithAmounts])

  return (
    <Card className='exposure-box'>
      <div className='text-center'>
        <SkeletonLoader loading={!tokens[baseToken] || !basePrice}>
          <Text>{tokens[baseToken]?.symbol}/{tokens[quoteToken]?.symbol} </Text>
          <TextBlue>({formatFloat(basePrice, 2)} {tokens[quoteToken]?.symbol}</TextBlue>
          {
            changedIn24h >= 0
              ? <TextBuy>+{changedIn24h}%</TextBuy>
              : <TextSell>{changedIn24h}%</TextSell>
          }
          <TextBlue>)</TextBlue>
        </SkeletonLoader>
      </div>
      <Box borderColor='#01A7FA' className='leverage-and-add-remove mb-1 mt-1'>
        <LeverageChangedInfoBox
          oldLeverage={oldLeverage}
          oldValue={oldValue}
          newLeverage={newLeverage}
          newValue={newValue}
          changedIn24h={changedIn24h}
          loading={!states.twapBase}
        />

        {formAddOrRemove && (
          <div className='amount-input-box'>
            <div className='amount-input-box__head'>
              <TextPink>
                <a
                  href={`https://pancakeswap.finance/add/${baseToken}/${quoteToken}`}
                  className='cursor-pointer text-decoration-none'
                  target='_blank' rel='noreferrer'
                >{tokens[cToken]?.symbol}_{tokens[baseToken]?.symbol}_{tokens[quoteToken]?.symbol}</a>
              </TextPink>
              <Text
                className='cursor-pointer'
                onClick={() => {
                  setCAmountToChange(weiToNumber(balances[cToken], tokens[cToken]?.decimal || 18))
                }}
              >Balance: {weiToNumber(balances[cToken], tokens[cToken]?.decimal || 18, 4)}</Text>
            </div>
            <Input
              // @ts-ignore
              value={cAmountToChange}
              onChange={(e) => {
                setCAmountToChange((e.target as HTMLInputElement).value)
              }}
              placeholder='0.0'
              suffix={<TextGrey>${formatFloat(mul(cTokenPrice || 0, cAmountToChange || 0), 2)}</TextGrey>}
              className='fs-24'
            />
          </div>
        )}

        {
          !formAddOrRemove &&
          <div className='add-and-remove-box'>
            <ButtonGrey className='btn-add' onClick={() => {
              setFormAddOrRemove('add')
            }}>
              Add
            </ButtonGrey>
            <ButtonGrey className='btn-remove' onClick={() => {
              setFormAddOrRemove('remove')
            }}>
              Remove
            </ButtonGrey>
          </div>
        }

        <Box
          className='leverage-info-box'
        >
          <div className='exposure-change-info'>
            <div className='exposure-change-info__left'>
              <Text>Exposure </Text>
              <LeverageValue leverage={oldLeverage} />
            </div>
            {
              oldLeverage !== newLeverage &&
              <React.Fragment>
                <IconArrowRight />
                <LeverageValue leverage={newLeverage} />
              </React.Fragment>
            }
          </div>

          <div className='leverage-input-box mt-1'>
            <div className='leverage-input-box__left'>
              {
                leverageManual
                  ? <Input
                    inputWrapProps={{
                      className: 'p-1'
                    }}
                    placeholder='Manual input exposure'
                    // @ts-ignore
                    value={newLeverage}
                    onChange={(e) => {
                      const max = Math.max(...Object.values(marks))
                      const min = Math.min(...Object.values(marks))
                      // @ts-ignore
                      const newValue = e.target.value
                      if (newValue >= min && newValue <= max) {
                        setNewLeverage(newValue)
                      }
                    }}
                  />
                  : <div className='pl-1'>
                    <CustomSlider
                      exposures={exposures}
                      oldLeverage={oldLeverage}
                      newLeverage={newLeverage}
                      marks={marks}
                      onChange={(e: number[]) => {
                        const newValue = e.find(e =>
                          Math.abs(e - oldLeverage) > 0.1 && Math.abs(e - newLeverage) > 0.1
                        )
                        if (newValue != null) {
                          setNewLeverage(Math.round(newValue * 10) / 10)
                        }
                      }}
                    />
                  </div>
              }
            </div>
            <ButtonGrey
              className='btn-switch-leverage-and-manual'
              onClick={() => {
                setLeverageManual(!leverageManual)
              }}>{leverageManual ? 'Slider' : 'Manual'}</ButtonGrey>
          </div>
        </Box>
      </Box>
      {
        swapSteps.length > 0 && (newLeverage !== oldLeverage || cAmountToChange) &&
        <Box borderColor='#3a3a3a' className='info-box1 ' title='Swaps'>
          {swapSteps.map((step: any, key: any) => {
            const stepFromToken = getTokenByPower(step.tokenIn)
            const stepToToken = getTokenByPower(step.tokenOut)
            const amountIn = step.amountIn
            const amountOut = stepsWithAmounts && stepsWithAmounts[key]?.amountOut ? stepsWithAmounts[key].amountOut : bn(0)
            if (amountIn.lte(bn(numberToWei(1)).div(powerState?.unit || 1000000))) {
              return ''
            }
            return <InfoRow key={key}>
              <span>
                <Text>{weiToNumber(amountIn, tokens[stepFromToken]?.decimal || 18, 4)}</Text>
                <TextGrey> <TokenSymbol token={tokens[stepFromToken]} /></TextGrey>
              </span>
              <IconArrowRight />
              <span>
                {
                  amountOut.gt(0)
                    ? <Text>{weiToNumber(amountOut, tokens[stepToToken]?.decimal || 18, 4)} </Text>
                    : '...'
                }
                {/* <Text>{weiToNumber(amountOut, tokens[stepToToken]?.decimal || 18, 4)} </Text> */}
                <TextGrey> <TokenSymbol token={tokens[stepToToken]} /></TextGrey>
              </span>
            </InfoRow>
          })
          }
          <Box
            borderColor='#3a3a3a'
            borderRadius='0'
            disableBorderLeft
            disableBorderRight
            disableBorderBottom
            style={{ padding: '0.5rem 0' }}
          >
            <InfoRow className='mb-1'>
              <Text>Gas Used</Text>
              <span>
                <Text>{gasUsed.toString()} Gas</Text>
              </span>
            </InfoRow>
            <InfoRow>
              <Text>Transaction Fee</Text>
              <span>
                <Text>{weiToNumber(txFee, 18, 4)} BNB (${weiToNumber(txFee.mul(nativePrice), 18, 2)})</Text>
              </span>
            </InfoRow>
          </Box>
        </Box>
      }

      {isDeleverage &&
      <Box className='text-center'>
        <input
          type='checkbox'
          checked={isDeleverage}
          id='is-deleverage' onChange={(e) => {
            setIsDeleverage(e.target.checked)
          }} />
        <label htmlFor='is-deleverage'> Deleverage</label>
      </Box>
      }

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

const LeverageValue = ({ leverage }: { leverage: number }) => {
  const LeverageLabel = leverage < 0 ? LabelSell : LabelBuy
  const LeverageText = leverage < 0 ? TextSell : TextBuy
  return <LeverageLabel
    className='d-inline-block'><LeverageText>{leverage >= 0 ? 'Long' : 'Short'} {formatFloat(leverage, 1)}</LeverageText></LeverageLabel>
}
