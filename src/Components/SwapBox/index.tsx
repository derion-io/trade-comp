import React, { useEffect, useMemo, useState } from 'react'
import { Text, TextGrey } from '../ui/Text'
import './style.scss'
import { Box } from '../ui/Box'
import { ButtonExecute } from '../ui/Button'
import 'rc-slider/assets/index.css'
import { IconArrowDown, IconOptionLeft } from '../ui/Icon'
import { Input } from '../ui/Input'
import { TokenIcon } from '../ui/TokenIcon'
import { useCurrentPool } from '../../state/currentPool/hooks/useCurrentPool'
import { useWeb3React } from '../../state/customWeb3React/hook'
import { BigNumber } from 'ethers'
import { SelectTokenModal } from '../SelectTokenModal'
import { useWalletBalance } from '../../state/wallet/hooks/useBalances'
import { useListTokens } from '../../state/token/hook'
import {
  bn,
  decodeErc1155Address, formatFloat,
  numberToWei,
  parseCallStaticError,
  weiToNumber
} from '../../utils/helpers'
import { TokenSymbol } from '../ui/TokenSymbol'
import { SkeletonLoader } from '../ui/SkeletonLoader'
import { NATIVE_ADDRESS } from '../../utils/constant'
import { PowerState } from 'powerLib'
import { useConfigs } from '../../state/config/useConfigs'
import { formatWeiToDisplayNumber } from '../../utils/formatBalance'
import isEqual from 'react-fast-compare'
import { useNativePrice } from '../../hooks/useTokenPrice'
import { toast } from 'react-toastify'
import { ApproveUtrModal } from '../ApproveUtrModal'
import { useSwapHistory } from '../../state/wallet/hooks/useSwapHistory'

const Component = () => {
  const { account, showConnectModal } = useWeb3React()
  const { configs, ddlEngine } = useConfigs()
  const { states, powers, dTokens, allTokens, TOKEN_R, id } = useCurrentPool()
  const [inputTokenAddress, setInputTokenAddress] = useState<string>('')
  const [outputTokenAddress, setOutputTokenAddress] = useState<string>('')
  const [visibleSelectTokenModal, setVisibleSelectTokenModal] = useState<boolean>(false)
  const [tokenTypeToSelect, setTokenTypeToSelect] = useState<'input' | 'output'>('input')
  const [callError, setCallError] = useState<string>('')
  const [amountOut, setAmountOut] = useState<string>('')
  const [amountOutWei, setAmountOutWei] = useState<BigNumber>(bn(0))
  const [amountIn, setAmountIn] = useState<string>('')
  const { balances, routerAllowances, fetchBalanceAndAllowance, accFetchBalance } = useWalletBalance()
  const [txFee, setTxFee] = useState<BigNumber>(bn(0))
  const [gasUsed, setGasUsed] = useState<BigNumber>(bn(0))
  const [loading, setLoading] = useState<boolean>(false)
  const [visibleApproveModal, setVisibleApproveModal] = useState<boolean>(false)
  const { tokens } = useListTokens()
  const { updateSwapTxsHandle } = useSwapHistory()
  const { data: nativePrice } = useNativePrice()
  // const { data: cpPrice } = useCpPrice()

  useEffect(() => {
    setInputTokenAddress(NATIVE_ADDRESS || '')
    setOutputTokenAddress(dTokens[0])
  }, [id])

  useEffect(() => {
    if (tokens[inputTokenAddress] && tokens[outputTokenAddress] && amountIn && Number(amountIn)) {
      calcAmountOut()
    } else if (Number(amountIn) === 0) {
      setAmountOut('')
      setTxFee(bn(0))
      setGasUsed(bn(0))
      setAmountOutWei(bn(0))
    }
  }, [tokens[inputTokenAddress] && tokens[outputTokenAddress], amountIn])

  const calcAmountOut = async () => {
    if (!amountOut) {
      setCallError('Calculating...')
    }
    // @ts-ignore
    ddlEngine.SWAP.calculateAmountOuts([{
      tokenIn: inputTokenAddress,
      tokenOut: outputTokenAddress,
      amountIn: bn(numberToWei(amountIn, tokens[inputTokenAddress]?.decimal || 18))
    }]).then((res: any) => {
      const [aOuts, gasLeft] = res
      setAmountOutWei(aOuts[0]?.amountOut || bn(0))
      setAmountOut(weiToNumber(aOuts[0]?.amountOut || 0, tokens[outputTokenAddress].decimal || 18))
      // @ts-ignore
      setTxFee(detectTxFee(gasLeft))
      // @ts-ignore
      setGasUsed(gasLeft)
      setCallError('')
    }).catch((e: any) => {
      const error = parseCallStaticError(e)
      setAmountOut('0')
      setTxFee(bn(0))
      setGasUsed(bn(0))
      setCallError(error ?? e)
      console.log(e)
    })
  }

  const detectTxFee = (gasUsed: BigNumber) => {
    return gasUsed.mul(2).div(3).mul(5 * 10 ** 9)
  }

  const revertPairAddress = () => {
    const inAddr = inputTokenAddress
    setInputTokenAddress(outputTokenAddress)
    setOutputTokenAddress(inAddr)
  }

  const renderExecuteButton = () => {
    const address = decodeErc1155Address(inputTokenAddress).address

    if (!tokens[inputTokenAddress] || loading) {
      return <ButtonExecute className='swap-button' disabled>Loading...</ButtonExecute>
    } else if (!account) {
      return <ButtonExecute
        onClick={() => {
          showConnectModal()
        }}
        className='swap-button'
      >Connect wallet</ButtonExecute>
    } else if (Number(amountIn) === 0) {
      return <ButtonExecute className='swap-button' disabled>Enter Amount</ButtonExecute>
    } else if (!balances[inputTokenAddress] || balances[inputTokenAddress].lt(numberToWei(amountIn, tokens[inputTokenAddress]?.decimal || 18))) {
      return <ButtonExecute className='swap-button'
        disabled> Insufficient {tokens[inputTokenAddress].symbol} Amount </ButtonExecute>
    // } else if (!routerAllowances[address] || routerAllowances[address].lt(numberToWei(amountIn, tokens[inputTokenAddress]?.decimal || 18))) {
    //   return <ButtonExecute
    //     className='swap-button'
    //     onClick={() => { setVisibleApproveModal(true) }}
    //   >Use EIP-6120</ButtonExecute>
    } else if (callError) {
      return <ButtonExecute className='swap-button' disabled>{callError}</ButtonExecute>
    } else {
      return <ButtonExecute
        className='swap-button'
        onClick={async () => {
          try {
            setLoading(true)
            if (ddlEngine) {
              const tx: any = await ddlEngine.SWAP.multiSwap(
                [{
                  tokenIn: inputTokenAddress,
                  tokenOut: outputTokenAddress,
                  amountIn: bn(numberToWei(amountIn, tokens[inputTokenAddress]?.decimal || 18)),
                  amountOutMin: 0
                }],
                gasUsed && gasUsed.gt(0) ? gasUsed.mul(2) : undefined
              )
              const swapLogs = ddlEngine.RESOURCE.parseDdlLogs(tx && tx?.logs ? tx.logs : [])
              updateSwapTxsHandle(account, swapLogs.filter((l: any) => l.address))
              await fetchBalanceAndAllowance(Object.keys(tokens))
            }
            setLoading(false)
          } catch (e) {
            console.log(e)
            setLoading(false)
            toast.error('Error')
          }
        }}
      >Swap</ButtonExecute>
    }
  }

  const protocolFee = useMemo(() => {
    // if (states?.twapLP && inputTokenAddress === poolAddress + '-' + POOL_IDS.cp && outputTokenAddress === cToken) {
    //   const cPrice = parseUq112x112(states.twapLP, 1000)
    //   return formatFloat(weiToNumber(amountOutWei
    //     .mul(3)
    //     .mul(cPrice * 1000)
    //     .div(1000 * 1000)
    //   , tokens[cToken]?.decimal || 18)
    //   , 2)
    // }
    return 0
  }, [states, amountOutWei, inputTokenAddress, outputTokenAddress])

  const getTokenPrice = (address: string, powerState: any) => {
    // if (address === cToken) {
    //   return cTokenPrice
    // } else if (address === configs.addresses.nativeToken) {
    //   return nativePrice
    // } else if (address === baseToken) {
    //   return basePrice
    // } else if (address === quoteToken) {
    //   return 1
    // }
    // if (powerState && isErc1155Address(address)) {
    //   const { id } = decodeErc1155Address(address)
    //   if (Number(id) === POOL_IDS.cp) {
    //     return cpPrice
    //   }
    //   const power = powers[id]
    //   return powerState.calculatePrice(power)
    // }
    return 1
  }

  const valueIn = useMemo(() => {
    if (powers && states.twapBase && Number(amountIn) > 0) {
      const powerState = new PowerState({ powers: [...powers] })
      powerState.loadStates(states)
      const price = getTokenPrice(inputTokenAddress, powerState)
      if (Number(price) === 0 || !Number(price)) {
        return 0
      }
      return formatFloat(weiToNumber(bn(numberToWei(amountIn)).mul(numberToWei(price || 0)), 36), 2)
    }
    return 0
  }, [powers, states, amountIn, inputTokenAddress, nativePrice])

  const valueOut = useMemo(() => {
    if (powers && states.twapBase && Number(amountOut) > 0) {
      const powerState = new PowerState({ powers: [...powers] })
      powerState.loadStates(states)
      const price = getTokenPrice(outputTokenAddress, powerState)
      if (Number(price) === 0 || !Number.isFinite(price)) {
        return 0
      }
      return formatFloat(weiToNumber(bn(numberToWei(amountOut)).mul(numberToWei(price || 0)), 36), 2)
    }
    return 0
  }, [powers, states, amountOut, outputTokenAddress, nativePrice])

  return (
    <div className='swap-box'>
      <div className='d-flex jc-space-between'>
        <Text>Swap</Text>
        <span><IconOptionLeft /></span>
      </div>

      <div className='amount-input-box'>
        <div className='amount-input-box__head'>
          <SkeletonLoader loading={!tokens[inputTokenAddress]}>
            <span
              className='current-token'
              onClick={(address) => {
                setVisibleSelectTokenModal(true)
                setTokenTypeToSelect('input')
              }}
            >
              <TokenIcon size={24} tokenAddress={inputTokenAddress} />
              <Text><TokenSymbol token={tokens[inputTokenAddress]} /></Text>
            </span>
          </SkeletonLoader>
          <SkeletonLoader loading={accFetchBalance !== account}>
            <Text
              className='amount-input-box__head--balance'
              onClick={() => {
                setAmountIn(weiToNumber(balances[inputTokenAddress], tokens[inputTokenAddress]?.decimal || 18))
              }}
            >Balance: {balances && balances[inputTokenAddress]
                ? formatWeiToDisplayNumber(
                  balances[inputTokenAddress],
                  4,
                tokens[inputTokenAddress]?.decimal || 18
                )
                : 0
              }
            </Text>
          </SkeletonLoader>
        </div>
        <Input
          placeholder='0.0'
          suffix={valueIn > 0 ? <TextGrey>${valueIn}</TextGrey> : ''}
          className='fs-24'
          // @ts-ignore
          value={amountIn}
          onChange={(e) => {
            // @ts-ignore
            if (Number(e.target.value) >= 0) {
              setAmountIn((e.target as HTMLInputElement).value)
            }
          }}
        />
      </div>

      <div className='text-center mt-2 mb-1'>
        <span className='arrow-down' onClick={() => {
          revertPairAddress()
        }}>
          <IconArrowDown fill='#01A7FA' />
        </span>
      </div>

      <div className='amount-input-box'>
        <div className='amount-input-box__head'>
          <SkeletonLoader loading={!tokens[inputTokenAddress]}>
            <span className='current-token' onClick={() => {
              setVisibleSelectTokenModal(true)
              setTokenTypeToSelect('output')
            }}>
              <TokenIcon size={24} tokenAddress={outputTokenAddress} />
              <Text><TokenSymbol token={tokens[outputTokenAddress]} /></Text>
            </span>
          </SkeletonLoader>
          <SkeletonLoader loading={accFetchBalance !== account}>
            <Text>Balance: {balances && balances[outputTokenAddress]
              ? formatWeiToDisplayNumber(
                balances[outputTokenAddress],
                4,
                tokens[outputTokenAddress]?.decimal || 18
              )
              : 0
            }
            </Text>
          </SkeletonLoader>
        </div>
        <Input
          // @ts-ignore
          value={Number(amountOut) > 0 ? amountOut : ''}
          placeholder='0.0'
          suffix={valueOut > 0 ? <TextGrey>${valueOut}</TextGrey> : ''}
          className='fs-24'
        />
      </div>

      <SelectTokenModal
        visible={visibleSelectTokenModal}
        setVisible={setVisibleSelectTokenModal}
        displayFee={tokenTypeToSelect === 'input'}
        tokens={[
          ...allTokens,
          TOKEN_R,
          // ...dTokens,
          // cToken,
          // poolAddress + '-' + POOL_IDS.cp,
          // baseToken,
          // quoteToken,
          configs.addresses.nativeToken
        ].filter((address) => {
          if (
            (tokenTypeToSelect === 'input' && (!balances[address] || balances[address].isZero()))
          ) {
            return false
          }
          return true
        })}
        onSelectToken={(address: string) => {
          if ((tokenTypeToSelect === 'input' && address === outputTokenAddress) ||
            (tokenTypeToSelect === 'output' && address === inputTokenAddress)
          ) {
            revertPairAddress()
            return
          }
          if (tokenTypeToSelect === 'input') {
            setInputTokenAddress(address)
          } else {
            setOutputTokenAddress(address)
          }
        }}
      />

      <Box borderColor='#3a3a3a' className='swap-info-box mt-2 mb-2'>
        {protocolFee && protocolFee > 0
          ? <InfoRow className='mb-1'>
            <span>
              <Text>Conversion Fee</Text>
            </span>
            <span>
              <Text>{protocolFee}</Text>
              <TextGrey> USD (0.3%)</TextGrey>
            </span>
          </InfoRow>
          : ''
        }
        <InfoRow className='mb-1'>
          <Text>Gas Used</Text>
          <span>
            <Text>{formatWeiToDisplayNumber(gasUsed, 0, 0)} Gas</Text>
          </span>
        </InfoRow>
        <InfoRow>
          <Text>Transaction Fee</Text>
          <span>
            <Text>
              {weiToNumber(txFee, 18, 4)}
              <TextGrey> BNB </TextGrey>
              (${weiToNumber(txFee.mul(numberToWei(nativePrice)), 36, 2)})
            </Text>
          </span>
        </InfoRow>
      </Box>

      <div className='actions'>
        {renderExecuteButton()}
      </div>

      <ApproveUtrModal
        callBack={() => {}}
        visible={visibleApproveModal}
        setVisible={setVisibleApproveModal}
        inputTokenAddress={inputTokenAddress}
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

export const SwapBox = React.memo(Component, (prevProps, nextProps) =>
  isEqual(prevProps, nextProps)
)
