import { ButtonExecute } from '../ui/Button'
import { bn, numberToWei } from '../../utils/helpers'
import { toast } from 'react-toastify'
import React, { useMemo, useState } from 'react'
import { useListTokens } from '../../state/token/hook'
import { useWeb3React } from '../../state/customWeb3React/hook'
import { useWalletBalance } from '../../state/wallet/hooks/useBalances'
import { useConfigs } from '../../state/config/useConfigs'
import { useSwapHistory } from '../../state/wallet/hooks/useSwapHistory'
import { BigNumber } from 'ethers'
import { TRADE_TYPE } from '../../utils/constant'

export const ButtonSwap = ({
  inputTokenAddress,
  outputTokenAddress,
  amountIn,
  callError,
  gasUsed,
  callback,
  tradeType,
  isSwap,
  isClose,
  title
}: {
  inputTokenAddress: string
  outputTokenAddress: string
  amountIn: string
  callError: string
  gasUsed: BigNumber
  callback?: any
  tradeType?: TRADE_TYPE
  isSwap?: boolean
  isClose?: boolean
  title: string
}) => {
  const { tokens } = useListTokens()
  const [loading, setLoading] = useState<boolean>(false)
  const { account, showConnectModal } = useWeb3React()
  const { balances, fetchBalanceAndAllowance } = useWalletBalance()
  const { ddlEngine } = useConfigs()

  const { updateSwapTxsHandle } = useSwapHistory()

  return useMemo(() => {
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
              updateSwapTxsHandle(account, swapLogs.filter((l: any) => l.transactionHash))
              await fetchBalanceAndAllowance(Object.keys(tokens))
            }
            setLoading(false)

            if (callback) {
              callback()
            }
          } catch (e) {
            console.log(e)
            setLoading(false)
            toast.error('Error')
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
    ddlEngine,
    loading,
    tokens,
    inputTokenAddress,
    outputTokenAddress,
    amountIn,
    callError,
    gasUsed,
    account
  ])
}
