import React, { useEffect, useState } from 'react'
import { Card } from '../ui/Card'
import { Text, TextGrey } from '../ui/Text'
import './style.scss'
import { Box } from '../ui/Box'
import { ButtonExecute } from '../ui/Button'
import 'rc-slider/assets/index.css'
import { IconArrowDown, IconOptionLeft } from '../ui/Icon'
import { Input } from '../ui/Input'
import { TokenIcon } from '../ui/TokenIcon'
import { useContract } from '../../hooks/useContract'
import { useCurrentPool } from '../../state/currentPool/hooks/useCurrentPool'
import { useWeb3React } from '../../state/customWeb3React/hook'
import { useConfigs } from '../../state/config/useConfigs'
import { BigNumber } from 'ethers'
import { SelectTokenModal } from '../SelectTokenModal'
import { useWalletBalance } from '../../state/wallet/hooks/useBalances'
import { useListTokens } from '../../state/token/hook'
import { bn, numberToWei, weiToNumber } from '../../utils/helpers'

export const SwapBox = () => {
  const { getRouterContract } = useContract()
  const { account, library } = useWeb3React()
  const { configs } = useConfigs()
  const { dTokens, cToken, logicAddress } = useCurrentPool()
  const [inputTokenAddress, setInputTokenAddress] = useState<string>('')
  const [outputTokenAddress, setOutputTokenAddress] = useState<string>('')
  const [visibleSelectTokenModal, setVisibleSelectTokenModal] = useState<boolean>(false)
  const [tokenTypeToSelect, setTokenTypeToSelect] = useState<'input' | 'output'>('input')
  const [amountOut, setAmountOut] = useState<string>('')
  const [amountIn, setAmountIn] = useState<string>('')
  const { balances, routerAllowances, approveRouter } = useWalletBalance()
  const [txFee, setTxFee] = useState<string>('')
  const { tokens } = useListTokens()

  useEffect(() => {
    setInputTokenAddress(cToken || '')
    setOutputTokenAddress(dTokens[0])
  }, [logicAddress])

  useEffect(() => {
    if (tokens[inputTokenAddress] && tokens[outputTokenAddress] && amountIn && Number(amountIn)) {
      calcAmountOut()
    }
  }, [tokens[inputTokenAddress] && tokens[outputTokenAddress], amountIn])

  const calcAmountOut = async () => {
    const signer = library.getSigner()
    const contract = getRouterContract(signer)
    try {
      const res = await contract.callStatic.multiSwap(
        configs.addresses.pool,
        [{
          tokenIn: inputTokenAddress,
          tokenOut: outputTokenAddress,
          amountIn: numberToWei(amountIn, tokens[inputTokenAddress]?.decimal || 18),
          amountOutMin: 0
        }],
        account,
        new Date().getTime() + 3600000
      )
      console.log('aOut', res)
      setAmountOut(weiToNumber(res.amountOuts[0], tokens[outputTokenAddress].decimal || 18))
      setTxFee(weiToNumber(detextTxFee(bn(res.gasLeft))).toString())
    } catch (e) {
      console.log(e)
    }
  }

  const detextTxFee = (gasLeft: BigNumber) => {
    return gasLeft.mul(2).div(3).mul(5 * 10 ** 9).mul(400)
  }

  const revertPairAddress = () => {
    const inAddr = inputTokenAddress
    setInputTokenAddress(outputTokenAddress)
    setOutputTokenAddress(inAddr)
  }

  const renderExecuteButton = () => {
    if (!tokens[inputTokenAddress]) {
      // @ts-ignore
      return <ButtonExecute className='swap-button' disabled>Loading...</ButtonExecute>
    } else if (!account) {
      // @ts-ignore
      return <ButtonExecute className='swap-button' disabled>Connect wallet</ButtonExecute>
    } else if (Number(amountIn) === 0) {
      // @ts-ignore
      return <ButtonExecute className='swap-button' disabled>Enter Amount</ButtonExecute>
    } else if (!balances[inputTokenAddress] || balances[inputTokenAddress].lt(numberToWei(amountIn, tokens[inputTokenAddress]?.decimal || 18))) {
      // @ts-ignore
      return <ButtonExecute className='swap-button' disabled> Insufficient {tokens[inputTokenAddress].symbol} Amount </ButtonExecute>
    } else if (routerAllowances[inputTokenAddress] && routerAllowances[inputTokenAddress].gt(numberToWei(amountIn, tokens[inputTokenAddress]?.decimal || 18))) {
      return <ButtonExecute
        className='swap-button'
        onClick={async () => {
          const signer = library.getSigner()
          const contract = getRouterContract(signer)
          try {
            await contract.callStatic.multiSwap(
              configs.addresses.pool,
              [{
                tokenIn: inputTokenAddress,
                tokenOut: outputTokenAddress,
                amountIn: numberToWei(amountIn, tokens[inputTokenAddress]?.decimal || 18),
                amountOutMin: 0
              }],
              account,
              new Date().getTime() + 3600000
            )
            await contract.multiSwap(
              configs.addresses.pool,
              [{
                tokenIn: inputTokenAddress,
                tokenOut: outputTokenAddress,
                amountIn: numberToWei(amountIn, tokens[inputTokenAddress]?.decimal || 18),
                amountOutMin: 0
              }],
              account,
              new Date().getTime() + 3600000
            )
          } catch (e) {
            console.log(e)
          }
        }}
      >Swap</ButtonExecute>
    } else {
      return <ButtonExecute
        className='swap-button'
        onClick={async () => {
          approveRouter({ tokenAddress: inputTokenAddress })
          // const signer = library.getSigner()
          // const contract = new ethers.Contract(inputTokenAddress, ERC20Abi, signer)
          // await contract.approve(configs.addresses.router, LARGE_VALUE)
        }}
      >approve</ButtonExecute>
    }
  }

  return (
    <Card className='swap-box'>
      <div className='d-flex jc-space-between'>
        <Text>Swap</Text>
        <span><IconOptionLeft /></span>
      </div>

      <div className='amount-input-box'>
        <div className='amount-input-box__head'>
          <span
            className='current-token'
            onClick={(address) => {
              setVisibleSelectTokenModal(true)
              setTokenTypeToSelect('input')
            }}
          >
            <TokenIcon size={24} tokenAddress={inputTokenAddress} />
            <Text>{tokens[inputTokenAddress]?.symbol}</Text>
          </span>
          <Text
            className='amount-input-box__head--balance'
            onClick={() => {
              setAmountIn(weiToNumber(balances[inputTokenAddress], tokens[inputTokenAddress]?.decimal || 18))
            }}
          >Balance: {weiToNumber(balances[inputTokenAddress], tokens[inputTokenAddress]?.decimal || 18)}</Text>
        </div>
        <Input
          placeholder='0.0'
          suffix='$0'
          className='fs-24'
          // @ts-ignore
          value={amountIn}
          onChange={(e) => {
            setAmountIn((e.target as HTMLInputElement).value)
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
          <span className='current-token' onClick={() => {
            setVisibleSelectTokenModal(true)
            setTokenTypeToSelect('output')
          }}>
            <TokenIcon size={24} tokenAddress={outputTokenAddress} />
            <Text>{tokens[outputTokenAddress]?.symbol}</Text>
          </span>
          <Text>Balance: {weiToNumber(balances[outputTokenAddress], tokens[outputTokenAddress]?.decimal || 18)}</Text>
        </div>
        <Input
          // @ts-ignore
          value={amountOut}
          placeholder='0.0' suffix='$0' className='fs-24' />
      </div>

      <SelectTokenModal
        visible={visibleSelectTokenModal}
        setVisible={setVisibleSelectTokenModal}
        tokens={[...dTokens, cToken]}
        onSelectToken={(address: string) => {
          if ((tokenTypeToSelect === 'input' && address === inputTokenAddress) ||
            (tokenTypeToSelect === 'output' && address === outputTokenAddress)
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
              <Text>Tx fee</Text>
            </span>
            <span>
              <Text>{txFee}</Text>
              <TextGrey>USD</TextGrey>
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

      <div className='actions'>
        {renderExecuteButton()}
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
