import {
  bn,
  decodeErc1155Address,
  isErc1155Address,
  numberToWei,
  parseCallStaticError,
  weiToNumber
} from '../../../utils/helpers'
import { useEffect, useState } from 'react'
import { useListTokens } from '../../../state/token/hook'
import { BigNumber, ethers } from 'ethers'
import { useConfigs } from '../../../state/config/useConfigs'
import { useWalletBalance } from '../../../state/wallet/hooks/useBalances'
import { useResource } from '../../../state/resources/hooks/useResource'
import { ZERO_ADDRESS } from '../../../utils/constant'

const ITERATION = 10
const REASONS_TO_RETRY = [
  'INSUFFICIENT_PAYMENT',
  'MINIMUM_SUPPLY',
  'MINIMUM_RESERVE'
]
let lastInput:number = 0
export const useCalculateSwap = ({
  amountIn,
  setAmountIn,
  inputTokenAddress,
  outputTokenAddress,
  tokenOutMaturity
}: {
  amountIn: string
  setAmountIn: any
  inputTokenAddress: string
  outputTokenAddress: string
  tokenOutMaturity: BigNumber
}) => {
  const { tokens } = useListTokens()
  const { pools } = useResource()
  const [callError, setCallError] = useState<string>('')
  const [amountOut, setAmountOut] = useState<string>('')
  const [payloadAmountIn, setPayloadAmountIn] = useState<BigNumber>()
  const [txFee, setTxFee] = useState<BigNumber>(bn(0))
  const [gasUsed, setGasUsed] = useState<BigNumber>(bn(0))
  const [amountOutWei, setAmountOutWei] = useState<BigNumber>(bn(0))
  const [loading, setLoading] = useState<boolean>(false)
  const { ddlEngine, configs } = useConfigs()
  const { balances, routerAllowances } = useWalletBalance()
  const [pairIndexR, setPairIndexR] = useState<string>()

  useEffect(() => {
    const poolAddress = isErc1155Address(inputTokenAddress)
      ? decodeErc1155Address(inputTokenAddress).address
      : isErc1155Address(outputTokenAddress)
      ? decodeErc1155Address(outputTokenAddress).address
      : ''
    const TOKEN_R = pools[poolAddress]?.TOKEN_R
    if (ddlEngine && TOKEN_R) {
      // eslint-disable-next-line no-unused-expressions
      ddlEngine?.UNIV3PAIR?.getLargestPoolAddress({
        baseToken: TOKEN_R,
        quoteTokens: configs.stableCoins
      })
        .then((uniPairAddress) => {
          setPairIndexR(uniPairAddress)
        })
        .catch(() => {
          setPairIndexR(ZERO_ADDRESS)
        })
    }
  }, [inputTokenAddress, outputTokenAddress, JSON.stringify(pools)])

  useEffect(() => {
    if (
      pairIndexR &&
      tokens[inputTokenAddress] &&
      tokens[outputTokenAddress] &&
      amountIn &&
      Number(amountIn) &&
      (isErc1155Address(inputTokenAddress) ||
        routerAllowances[inputTokenAddress]?.gt(
          numberToWei(amountIn, tokens[inputTokenAddress]?.decimal || 18)
        ))
    ) {
      if (!amountOut) {
        setCallError('Calculating...')
      }
      lastInput = Number(amountIn)
      setLoading(true)
      calcAmountOut()
    } else if (Number(amountIn) === 0) {
      setAmountOut('')
      setTxFee(bn(0))
      setGasUsed(bn(0))
      setAmountOutWei(bn(0))
    }
  }, [
    pairIndexR,
    tokens[inputTokenAddress]?.address,
    tokens[outputTokenAddress]?.address,
    tokenOutMaturity.toString(),
    amountIn,
    JSON.stringify(routerAllowances[inputTokenAddress])
  ])

  const calcAmountOut = async (i: number = 0): Promise<any> => {
    try {
      const inputAmount = numberToWei(
        amountIn,
        tokens[inputTokenAddress]?.decimal ?? 18
      )
      let _payloadAmountIn = bn(inputAmount)
      if (i > 0) {
        const redution = 2 ** (i - ITERATION)
        _payloadAmountIn = _payloadAmountIn
          .mul(numberToWei(1 - redution, 6))
          .div(1000000)
        console.log({
          i,
          redution,
          inputAmount,
          payloadAmount: _payloadAmountIn.toString()
        })
      }
      // @ts-ignore
      const res = await ddlEngine.SWAP.calculateAmountOuts([
        {
          tokenIn: inputTokenAddress,
          tokenOut: outputTokenAddress,
          amountOutMin: 0,
          amountIn: numberToWei(
            amountIn,
            tokens[inputTokenAddress]?.decimal || 18
          ),
          payloadAmountIn: _payloadAmountIn,
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
      ])
      console.log('calculate amountOut response', res)
      if (Number(amountIn) === Number(lastInput)) {
        const [aOuts, gasLeft] = res
        setAmountOutWei(aOuts[0]?.amountOut || bn(0))
        setPayloadAmountIn(_payloadAmountIn)
        setAmountOut(
          weiToNumber(
            aOuts[0]?.amountOut || 0,
            tokens[outputTokenAddress].decimal || 18
          )
        )
        // @ts-ignore
        setTxFee(detectTxFee(gasLeft))
        // @ts-ignore
        setGasUsed(gasLeft)
        setCallError('')
        setLoading(false)
      } else {
        setLoading(true)
      }
    } catch (e) {
      const reason = parseCallStaticError(e)
      if (i < ITERATION && REASONS_TO_RETRY.some((R) => reason.includes(R))) {
        return calcAmountOut(i + 1)
      }
      setAmountOut('0')
      setTxFee(bn(0))
      setGasUsed(bn(0))
      setCallError(reason ?? e)
      setPayloadAmountIn(undefined)
      if (i >= ITERATION) {
        throw e
      }
    }
  }

  const detectTxFee = (gasUsed: BigNumber) => {
    return gasUsed
      .mul(2)
      .div(3)
      .mul(5 * 10 ** 9)
  }

  return {
    pairIndexR,
    loading,
    callError,
    txFee,
    gasUsed,
    amountOutWei,
    payloadAmountIn,
    amountOut
  }
}
