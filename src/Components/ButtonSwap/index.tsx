import { ButtonExecute } from '../ui/Button'
import { bn, div, mul, numberToWei } from '../../utils/helpers'
import { toast } from 'react-toastify'
import React, { useMemo, useState } from 'react'
import { useListTokens } from '../../state/token/hook'
import { useWeb3React } from '../../state/customWeb3React/hook'
import { useWalletBalance } from '../../state/wallet/hooks/useBalances'
import { useConfigs } from '../../state/config/useConfigs'
import { useSwapHistory } from '../../state/wallet/hooks/useSwapHistory'
import { BigNumber, ethers } from 'ethers'
import { CHAINS, TRADE_TYPE } from '../../utils/constant'
import { TextError } from '../ui/Text'
import { useSettings } from '../../state/setting/hooks/useSettings'

export const ButtonSwap = ({
  inputTokenAddress,
  outputTokenAddress,
  amountIn,
  amountOut,
  callError,
  gasUsed,
  callback,
  tradeType,
  loadingAmountOut,
  isSwap,
  isClose,
  title,
  payoffRate,
  tokenOutMaturity
}: {
  inputTokenAddress: string
  outputTokenAddress: string
  amountIn: string
  amountOut: string
  callError: string
  gasUsed: BigNumber
  callback?: any
  loadingAmountOut?: boolean
  tradeType?: TRADE_TYPE
  isSwap?: boolean
  isClose?: boolean
  title: any
  payoffRate?: number
  tokenOutMaturity: BigNumber
}) => {
  const { tokens } = useListTokens()
  const [loading, setLoading] = useState<boolean>(false)
  const { account, showConnectModal } = useWeb3React()
  const { balances, fetchBalanceAndAllowance } = useWalletBalance()
  const { ddlEngine } = useConfigs()
  const { settings: { slippage, minPayoffRate } } = useSettings()
  const { chainId } = useWeb3React()

  const { updateSwapTxsHandle } = useSwapHistory()

  const button = useMemo(() => {
    if (!tokens[inputTokenAddress] || loading) {
      return <ButtonExecute className='swap-button' disabled>Loading...</ButtonExecute>
    } else if (!account) {
      return <ButtonExecute
        onClick={() => {
          showConnectModal()
        }}
        className='swap-button'
      >Connect Wallet</ButtonExecute>
    } else if (!Object.values(CHAINS).includes(chainId)) {
      return <ButtonExecute className='swap-button' disabled>Unsupported Network</ButtonExecute>
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
        disabled={Number(payoffRate) < minPayoffRate}
        className='swap-button'
        onClick={async () => {
          try {
            setLoading(true)
            if (ddlEngine) {
              const amountOutMin = numberToWei(div(mul(amountOut, 100 - slippage), 100), tokens[outputTokenAddress]?.decimals || 18)
              const tx: any = await ddlEngine.SWAP.multiSwap(
                [{
                  tokenIn: inputTokenAddress,
                  tokenOut: outputTokenAddress,
                  amountIn: bn(numberToWei(amountIn, tokens[inputTokenAddress]?.decimal || 18)),
                  amountOutMin,
                  useSweep: tokenOutMaturity?.gt(0) && balances[outputTokenAddress],
                  currentBalanceOut: balances[outputTokenAddress],
                  index_R: bn(ethers.utils.hexZeroPad(
                    bn(1).shl(255)
                      .add('0xC31E54c7a869B9FcBEcc14363CF510d1c41fa443')
                      .toHexString(),
                    32
                  ))
                }],
                gasUsed && gasUsed.gt(0) ? gasUsed.mul(2) : undefined
              )
              const swapLogs = ddlEngine.RESOURCE.parseDdlLogs(tx && tx?.logs ? tx.logs : [])
              updateSwapTxsHandle(account, swapLogs.filter((l: any) => l.transactionHash))
              await fetchBalanceAndAllowance(Object.keys(tokens))
            }
            setLoading(false)

            if (callback) {
              callback()
            }
          } catch (e) {
            console.error(e)
            setLoading(false)
            toast.error(String(e.message ?? e))
          }
        }}
      >
        {title}
        {/* { */}
        {/*  tradeType !== undefined */}
        {/*    ? tradeType === TRADE_TYPE.LONG */}
        {/*      ? 'Long' */}
        {/*      : tradeType === TRADE_TYPE.SHORT */}
        {/*        ? 'Short' */}
        {/*        : 'Add Liquidity' */}
        {/*    : isClose ? 'Close' : 'Short' */}
        {/* } */}
      </ButtonExecute>
    }
  }, [
    chainId,
    amountOut,
    slippage,
    ddlEngine,
    loading,
    tokens,
    inputTokenAddress,
    outputTokenAddress,
    amountIn,
    callError,
    gasUsed,
    account,
    tokenOutMaturity
  ])

  return <React.Fragment>
    {
      payoffRate && payoffRate < 94 && !loadingAmountOut
        ? <div className='text-center mb-1'>
          {
            tradeType === TRADE_TYPE.LONG
              ? <TextError>The Premium Rate is too high due to an imbalance between the Long and Short positions in the pool.</TextError>
              : tradeType === TRADE_TYPE.SHORT
                ? <TextError>The Premium Rate is too high due to an imbalance between the  Short and Long positions in the pool.</TextError>
                : <TextError>The Payoff Rate is too low because your position has not yet fully matured.</TextError>
          }
        </div>
        : ''
    }
    {button}
  </React.Fragment>
}
