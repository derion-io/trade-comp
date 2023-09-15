import { ButtonExecute } from '../ui/Button'
import { bn, isErc1155Address, mul, WEI } from '../../utils/helpers'
import { toast } from 'react-toastify'
import React, { useMemo, useState } from 'react'
import { useListTokens } from '../../state/token/hook'
import { useWeb3React } from '../../state/customWeb3React/hook'
import { useWalletBalance } from '../../state/wallet/hooks/useBalances'
import { useConfigs } from '../../state/config/useConfigs'
import { useSwapHistory } from '../../state/wallet/hooks/useSwapHistory'
import { BigNumber, ethers } from 'ethers'
import { CHAINS, TRADE_TYPE, ZERO_ADDRESS } from '../../utils/constant'
import { TextError } from '../ui/Text'
import { useSettings } from '../../state/setting/hooks/useSettings'
import { ApproveUtrModal } from '../ApproveUtrModal'
import { useResource } from '../../state/resources/hooks/useResource'

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
  payloadAmountIn,
  title,
  payoffRate,
  tokenOutMaturity,
  pairIndexR
}: {
  pairIndexR?: string
  inputTokenAddress: string
  outputTokenAddress: string
  amountIn: string
  amountOut: string
  callError: string
  payloadAmountIn?: BigNumber
  gasUsed: BigNumber
  callback?: any
  loadingAmountOut?: boolean
  tradeType?: TRADE_TYPE
  title: any
  payoffRate?: number
  tokenOutMaturity: BigNumber
}) => {
  const { tokens } = useListTokens()
  const [loading, setLoading] = useState<boolean>(false)
  const [visibleApproveModal, setVisibleApproveModal] = useState<boolean>(false)
  const { account, showConnectModal } = useWeb3React()
  const { balances, fetchBalanceAndAllowance, routerAllowances } =
    useWalletBalance()
  const { ddlEngine } = useConfigs()
  const { settings } = useSettings()
  const { chainId } = useWeb3React()
  const { initResource } = useResource()
  const slippage = 1 - Math.min(1, payoffRate ?? 0)

  const { updateSwapTxsHandle } = useSwapHistory()
  const button = useMemo(() => {
    if (!tokens[inputTokenAddress] || loading) {
      return (
        <ButtonExecute className='swap-button' disabled>
          Loading...
        </ButtonExecute>
      )
    } else if (!account) {
      return (
        <ButtonExecute
          onClick={() => {
            showConnectModal()
          }}
          className='swap-button'
        >
          Connect Wallet
        </ButtonExecute>
      )
    } else if (!Object.values(CHAINS).includes(chainId)) {
      return (
        <ButtonExecute className='swap-button' disabled>
          Unsupported Network
        </ButtonExecute>
      )
    } else if (Number(amountIn) === 0) {
      return (
        <ButtonExecute className='swap-button' disabled>
          Enter Amount
        </ButtonExecute>
      )
    } else if (
      !balances[inputTokenAddress] ||
      balances[inputTokenAddress].lt(
        WEI(amountIn, tokens[inputTokenAddress]?.decimal || 18)
      )
    ) {
      return (
        <ButtonExecute className='swap-button' disabled>
          {' '}
          Insufficient {tokens[inputTokenAddress].symbol} Amount{' '}
        </ButtonExecute>
      )
    } else if (
      !isErc1155Address(inputTokenAddress) &&
      routerAllowances[inputTokenAddress].lt(
        WEI(amountIn, tokens[inputTokenAddress]?.decimal || 18)
      )
    ) {
      return (
        <ButtonExecute
          className='swap-button'
          onClick={() => {
            setVisibleApproveModal(true)
          }}
        >
          Enable EIP-6120
        </ButtonExecute>
      )
    } else if (callError) {
      return (
        <ButtonExecute className='swap-button' disabled>
          {callError}
        </ButtonExecute>
      )
    } else {
      return (
        <ButtonExecute
          disabled={
            slippage > settings.slippageTolerance || !pairIndexR || loadingAmountOut
          }
          className='swap-button'
          onClick={async () => {
            try {
              setLoading(true)
              if (ddlEngine) {
                const amountOutMin = WEI(
                  mul(amountOut, 1 - settings.slippageTolerance),
                  tokens[outputTokenAddress]?.decimals || 18
                )
                console.log({
                  amountIn: WEI(
                    amountIn,
                    tokens[inputTokenAddress]?.decimal || 18
                  ),
                  payloadAmountIn: payloadAmountIn?.toString()
                })
                const tx: any = await ddlEngine.SWAP.multiSwap(
                  [
                    {
                      tokenIn: inputTokenAddress,
                      tokenOut: outputTokenAddress,
                      amountIn: bn(
                        WEI(amountIn, tokens[inputTokenAddress]?.decimal || 18)
                      ),
                      amountOutMin,
                      payloadAmountIn,
                      useSweep: !!(
                        tokenOutMaturity?.gt(0) &&
                        balances[outputTokenAddress] &&
                        isErc1155Address(outputTokenAddress)
                      ),
                      currentBalanceOut: balances[outputTokenAddress],
                      index_R:
                        pairIndexR && pairIndexR !== ZERO_ADDRESS
                          ? bn(
                              ethers.utils.hexZeroPad(
                                bn(1).shl(255).add(pairIndexR).toHexString(),
                                32
                              )
                            )
                          : bn(0)
                    }
                  ],
                  gasUsed && gasUsed.gt(0) ? gasUsed.mul(2) : undefined
                )
                const swapLogs = ddlEngine.RESOURCE.parseDdlLogs(
                  tx && tx?.logs ? tx.logs : []
                )
                updateSwapTxsHandle(
                  account,
                  swapLogs.filter(
                    (l: any) => l.transactionHash && l.args?.name === 'Swap'
                  )
                )
                await fetchBalanceAndAllowance(Object.keys(tokens))
                await initResource(account)
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
          {!pairIndexR
            ? 'Routing...'
            : loadingAmountOut || !amountOut
            ? 'Calculating...'
            : title}
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
      )
    }
  }, [
    pairIndexR,
    chainId,
    amountOut,
    slippage,
    settings.slippageTolerance,
    ddlEngine,
    loading,
    tokens,
    inputTokenAddress,
    outputTokenAddress,
    loadingAmountOut,
    amountIn,
    callError,
    gasUsed,
    account,
    tokenOutMaturity,
    routerAllowances[inputTokenAddress]
  ])

  return (
    <React.Fragment>
      {payoffRate && slippage > settings.slippageTolerance && !loadingAmountOut ? (
        <div className='text-center mb-1'>
          <TextError>Market spread and/or slippage is too high.</TextError>
        </div>
      ) : (
        ''
      )}
      {button}
      <ApproveUtrModal
        callBack={() => {}}
        visible={visibleApproveModal}
        setVisible={setVisibleApproveModal}
        inputTokenAddress={inputTokenAddress}
      />
    </React.Fragment>
  )
}
