import React, { useEffect, useMemo, useState } from 'react'
import { Text, TextBlue, TextBuy, TextGrey, TextPink, TextSell } from '../ui/Text'
import './style.scss'
import { Box } from '../ui/Box'
import { LabelBuy, LabelSell } from '../ui/Label'
import { ButtonExecute, ButtonGrey, ButtonReset } from '../ui/Button'
import 'rc-slider/assets/index.css'
import Slider from 'rc-slider'
import { IconArrowRight } from '../ui/Icon'
import { Input } from '../ui/Input'
import { useCurrentPool } from '../../state/currentPool/hooks/useCurrentPool'
import { PowerState } from 'powerLib'
import {
  bn,
  decodeErc1155Address, div,
  formatFloat,
  numberToWei,
  parseCallStaticError,
  weiToNumber
} from '../../utils/helpers'
import { useWalletBalance } from '../../state/wallet/hooks/useBalances'
import { useListTokens } from '../../state/token/hook'
import { BigNumber, ethers } from 'ethers'
import { useWeb3React } from '../../state/customWeb3React/hook'
import { toast } from 'react-toastify'
import { TokenSymbol } from '../ui/TokenSymbol'
import { SkeletonLoader } from '../ui/SkeletonLoader'
import { LeverageChangedInfoBox } from './LeverageChangedInfoBox'
import { CustomSlider } from './CustomSlider'
import { SelectTokenModal } from '../SelectTokenModal'
import { useConfigs } from '../../state/config/useConfigs'
import { TokenIcon } from '../ui/TokenIcon'
import { StepType } from '../../utils/type'
import { RemoveForm } from './RemoveForm'
import { formatWeiToDisplayNumber } from '../../utils/formatBalance'
import isEqual from 'react-fast-compare'
import { useNativePrice } from '../../hooks/useTokenPrice'

export const Component = ({ changedIn24h }: {
  changedIn24h: number
}) => {
  const { ddlEngine, configs } = useConfigs()
  const [formAddOrRemove, setFormAddOrRemove] = useState<'add' | 'remove' | undefined>(undefined)
  const [newLeverage, setNewLeverage] = useState<number>(0)
  const [newValue, setNewValue] = useState<BigNumber>()
  const { account, showConnectModal } = useWeb3React()
  const [loading, setLoading] = useState<boolean>(false)
  const { dTokens, cToken, states, powers, baseToken, quoteToken, cTokenPrice, basePrice, getTokenByPower, detectChangeType } = useCurrentPool()
  const { balances, routerAllowances, approveRouter, fetchBalanceAndAllowance } = useWalletBalance()
  const [balanceInPool, setBalancesInPool] = useState<any>({})
  const [amountToChange, setAmountToChange] = useState<string>('')
  const [swapSteps, setSwapsteps] = useState<any>([])
  const [isDeleverage, setIsDeleverage] = useState<boolean>(false)
  const [inputTokenAddress, setInputTokenAddress] = useState<string>('')
  const { tokens } = useListTokens()
  const [stepsWithAmounts, setStepsWithAmounts] = useState<{ amountOut: BigNumber }[]>([])
  const [callError, setCallError] = useState<string>('')
  const [leverageManual, setLeverageManual] = useState<boolean>(false)
  const [txFee, setTxFee] = useState<BigNumber>(bn(0))
  const [gasUsed, setGasUsed] = useState<BigNumber>(bn(0))
  const [visibleSelectTokenModal, setVisibleSelectTokenModal] = useState<boolean>(false)
  const [removePercent, setRemovePercent] = useState<number>()

  const { data: nativePrice } = useNativePrice()

  const resetFormHandle = () => {
    setAmountToChange('')
    setFormAddOrRemove(undefined)
    setNewLeverage(oldLeverage)
    setInputTokenAddress(cToken)
    setRemovePercent(undefined)
    setLoading(false)
  }

  useEffect(() => {
    setInputTokenAddress(cToken)
  }, [cToken])

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
      return [p, oldLeverage, oldValue, marks, exposure]
    }
    return [null, 0, oldValue, {}, []]
  }, [powers, states, balances])

  const tokenNeedApprove = useMemo(() => {
    const result: string[] = []
    for (const i in swapSteps) {
      const tokenIn = ethers.utils.isAddress(swapSteps[i].tokenIn)
        ? swapSteps[i].tokenIn
        : decodeErc1155Address(getTokenByPower(swapSteps[i].tokenIn)).address
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
        const { amount, value } = detectCAmount()
        const currentBalances = getCurrentBalances()
        setNewValue(value)

        const stepsRes = powerState.getSwapSteps(balanceInPool, newLeverage, amount, detectChangeType(inputTokenAddress))
          .filter((step) => step.amountIn.gt(0))
        const steps = convertIfTokenIsNative(stepsRes)
        const { amountOuts } = powerState.swap(currentBalances, steps)
        const stepsWithAmounts = amountOuts.map((amountOut) => {
          return { amountOut }
        })

        setStepsWithAmounts(stepsWithAmounts)
        setSwapsteps(steps)
      }
    } catch (e) {
      console.error(e)
    }
  }, [removePercent, oldLeverage, newLeverage, powerState, amountToChange, inputTokenAddress])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (!isHaveStepToSwap()) return
      if (stepsWithAmounts.length === 0) {
        setCallError('Calculating...')
      }

      // @ts-ignore
      ddlEngine.SWAP.calculateAmountOuts(swapSteps, isDeleverage)
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
    }, 500)
    return () => {
      clearTimeout(delayDebounceFn)
    }
  }, [swapSteps, isDeleverage])

  const getTokenPrice = (address: string) => {
    if (address === cToken) {
      return cTokenPrice
    } else if (address === configs.addresses.nativeToken) {
      return nativePrice
    } else if (address === baseToken) {
      return basePrice
    } else if (address === quoteToken) {
      return 1
    }
    return 0
  }

  const valueIn = useMemo(() => {
    if (powers && states.twapBase && Number(amountToChange) > 0) {
      const price = getTokenPrice(inputTokenAddress)
      if (price === 0 || !Number(price)) {
        return 0
      }
      return formatFloat(weiToNumber(bn(numberToWei(amountToChange)).mul(numberToWei(price || 0)), 36), 2)
    }
    return 0
  }, [powers, states, amountToChange, inputTokenAddress, nativePrice])

  const isHaveStepToSwap = () => {
    // return swapSteps.filter((step: {amountIn: BigNumber}) => {
    //    return step.amountIn.gt(bn(numberToWei(1)).div(powerState?.unit || 1000000))
    // }).length > 0
    return swapSteps.length > 0
  }

  const convertIfTokenIsNative = (steps: StepType[]) => {
    let result = steps
    if (inputTokenAddress === configs.addresses.nativeToken) {
      result = steps.map((step) => {
        if ((step.tokenIn === 'B' && inputTokenAddress === configs.addresses.nativeToken && baseToken === configs.addresses.wrapToken) ||
          (step.tokenIn === 'Q' && inputTokenAddress === configs.addresses.nativeToken && quoteToken === configs.addresses.wrapToken)
        ) {
          step.tokenIn = 'N'
        } else if ((step.tokenOut === 'B' && inputTokenAddress === configs.addresses.nativeToken && baseToken === configs.addresses.wrapToken) ||
          (step.tokenOut === 'Q' && inputTokenAddress === configs.addresses.nativeToken && quoteToken === configs.addresses.wrapToken)
        ) {
          step.tokenOut = 'N'
        }
        return step
      })
    }
    return result
  }

  const getCurrentBalances = () => {
    const currentBalances = {}
    powers.forEach((power, key) => {
      if (balances[dTokens[key]] && balances[dTokens[key]].gt(0)) {
        currentBalances[power] = bn(balances[dTokens[key]])
      }
    })
    return currentBalances
  }

  const detectCAmount = () => {
    let value = powerState?.calculateCompValue(balanceInPool) || bn(0)
    let amount: BigNumber | number = bn(0)
    let cTokenValue = bn(0)
    if ((amountToChange || removePercent) && powerState) {
      if (formAddOrRemove === 'remove' && removePercent) {
        amount = Number(div(-removePercent, 100))
        cTokenValue = value.mul(numberToWei(-removePercent)).div(numberToWei(100, 18 + tokens[cToken]?.decimal - tokens[quoteToken]?.decimal))
      } else {
        const price = getTokenPrice(inputTokenAddress)
        amount = bn(numberToWei(amountToChange, tokens[cToken]?.decimal || 18))
        cTokenValue = amount.mul(numberToWei(price)).div(numberToWei(1, 18 + tokens[cToken]?.decimal - tokens[quoteToken]?.decimal))
      }
      value = value.add(cTokenValue)
    }

    return { value, amount }
  }

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
      return <ButtonExecute className='execute-button mr-1' disabled>{callError.toString()}</ButtonExecute>
    } else {
      return <ButtonExecute
        disabled={!isHaveStepToSwap() || stepsWithAmounts.length === 0}
        onClick={async () => {
          setLoading(true)
          try {
            await ddlEngine?.SWAP.updateLeverageAndSize(swapSteps, isDeleverage)
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

  return (
    <div className='exposure-box'>
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

        {formAddOrRemove === 'add' && (
          <div className='amount-input-box'>
            <div className='amount-input-box__head'>
              <TextPink className='amount-input-box__head--left cursor-pointer text-decoration-none' onClick={() => {
                if (formAddOrRemove === 'add') {
                  setVisibleSelectTokenModal(true)
                }
              }}>
                <TokenIcon size={24} className='mr-05' tokenAddress={inputTokenAddress} />
                <TokenSymbol token={tokens[inputTokenAddress]} />
                {/* <span */}
                {/*  href={`https://pancakeswap.finance/add/${baseToken}/${quoteToken}`} */}
                {/*  className='cursor-pointer text-decoration-none' */}
                {/* >{tokens[cToken]?.symbol}_{tokens[baseToken]?.symbol}_{tokens[quoteToken]?.symbol}</span> */}
              </TextPink>
              <Text
                className='cursor-pointer'
                onClick={() => {
                  setAmountToChange(weiToNumber(balances[inputTokenAddress], tokens[inputTokenAddress]?.decimal || 18))
                }}
              >Balance: {weiToNumber(balances[inputTokenAddress], tokens[inputTokenAddress]?.decimal || 18, 4)}</Text>
            </div>
            <Input
              // @ts-ignore
              value={amountToChange}
              onChange={(e) => {
                setAmountToChange((e.target as HTMLInputElement).value)
              }}
              placeholder='0.0'
              suffix={valueIn > 0 ? <TextGrey>${valueIn}</TextGrey> : ''}
              className='fs-24'
            />
          </div>
        )}
        {formAddOrRemove === 'remove' && (
          <RemoveForm
            removePercent={removePercent}
            setRemovePercent={setRemovePercent}
            totalValue={oldValue}
          />
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
                    type='number'
                    onChange={(e) => {
                      const max = Math.max(...Object.values(marks))
                      const min = Math.min(...Object.values(marks))
                      // @ts-ignore
                      const newValue = Number(e.target.value)
                      if (newValue >= max) {
                        setNewLeverage(max)
                      } else if (newValue <= min) {
                        setNewLeverage(min)
                      } else {
                        // @ts-ignore
                        setNewLeverage(e.target.value)
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
        swapSteps.length > 0 && (newLeverage !== oldLeverage || amountToChange || removePercent) &&
        <Box borderColor='#3a3a3a' className='info-box1 ' title='Swaps'>
          {swapSteps.map((step: any, key: any) => {
            const stepFromToken = getTokenByPower(step.tokenIn)
            const stepToToken = getTokenByPower(step.tokenOut)
            const amountIn = step.amountIn
            const amountOut = stepsWithAmounts && stepsWithAmounts[key]?.amountOut ? stepsWithAmounts[key].amountOut : bn(0)
            // if (amountIn.lte(bn(numberToWei(1)).div(powerState?.unit || 1000000))) {
            //   return ''
            // }
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
                <Text>{formatWeiToDisplayNumber(gasUsed, 0, 0)} Gas</Text>
              </span>
            </InfoRow>
            <InfoRow>
              <Text>Transaction Fee</Text>
              <span>
                <Text>{weiToNumber(txFee, 18, 4)} BNB (${weiToNumber(txFee.mul(numberToWei(nativePrice)), 36, 2)})</Text>
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
      <SelectTokenModal
        visible={visibleSelectTokenModal}
        setVisible={setVisibleSelectTokenModal}
        tokens={[
          cToken,
          quoteToken,
          baseToken,
          configs.addresses.nativeToken
        ].filter((address) => {
          return address === cToken || (balances[address] && balances[address].gt(0))
        })}
        displayFee={formAddOrRemove === 'add'}
        onSelectToken={(address: string) => {
          setInputTokenAddress(address)
        }}
      />
    </div>
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

export const ExposureBox = React.memo(Component, (prevProps, nextProps) =>
  isEqual(prevProps, nextProps)
)
