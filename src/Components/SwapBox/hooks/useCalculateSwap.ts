import {
  BIG,
  bn,
  decodeErc1155Address,
  isErc1155Address,
  WEI,
  parseCallStaticError,
  IEW
} from '../../../utils/helpers'
import { useEffect, useState } from 'react'
import { useListTokens } from '../../../state/token/hook'
import { BigNumber, ethers } from 'ethers'
import { useConfigs } from '../../../state/config/useConfigs'
import { useWalletBalance } from '../../../state/wallet/hooks/useBalances'
import { useResource } from '../../../state/resources/hooks/useResource'
import { NATIVE_ADDRESS, ZERO_ADDRESS } from '../../../utils/constant'

const ITERATION = 10
const REASONS_TO_RETRY = [
  'INSUFFICIENT_PAYMENT',
  'MINIMUM_SUPPLY',
  'MINIMUM_RESERVE'
]

let amountInLast: string = ''

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
  const [pairIndexR, setPairIndexR] = useState<string>(configs.addresses.wrapUsdPair)

  useEffect(() => {
    const poolAddress = isErc1155Address(inputTokenAddress)
      ? decodeErc1155Address(inputTokenAddress).address
      : isErc1155Address(outputTokenAddress)
      ? decodeErc1155Address(outputTokenAddress).address
      : ''
    const TOKEN_R = pools[poolAddress]?.TOKEN_R
    if (TOKEN_R == configs.addresses.wrapToken) {
      setPairIndexR(configs.addresses.wrapUsdPair)
      return
    }
    if (ddlEngine && TOKEN_R) {
      setPairIndexR('')
      // eslint-disable-next-line no-unused-expressions
      ddlEngine?.UNIV3PAIR?.getLargestPoolAddress({
        baseToken: TOKEN_R,
        quoteTokens: configs.stableCoins
      })
        .then((uniPairAddress) => {
          setPairIndexR(uniPairAddress)
        })
        .catch(console.error)
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
          WEI(amountIn, tokens[inputTokenAddress]?.decimal || 18)
        ))
    ) {
      if (!amountOut) {
        setCallError('Calculating...')
      }
      amountInLast = amountIn
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
      const inputAmount = WEI(
        amountIn,
        tokens[inputTokenAddress]?.decimal ?? 18
      )
      let _payloadAmountIn = bn(inputAmount)
      if (i > 0) {
        const redution = 2 ** (i - ITERATION)
        _payloadAmountIn = _payloadAmountIn
          .mul(WEI(1 - redution, 6))
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
          amountIn: BIG(
            WEI(amountIn, tokens[inputTokenAddress]?.decimal || 18)
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
      if (amountIn !== amountInLast) {
        return // skip the calcuation and update for outdated input
      }
      const [aOuts, gasLeft] = res
      setAmountOutWei(aOuts[0]?.amountOut || bn(0))
      setPayloadAmountIn(_payloadAmountIn)
      setAmountOut(
        IEW(aOuts[0]?.amountOut || 0, tokens[outputTokenAddress].decimal || 18)
      )
      // @ts-ignore
      setTxFee(detectTxFee(gasLeft))
      // @ts-ignore
      setGasUsed(gasLeft)
      setCallError('')
    } catch (e) {
      if (amountIn !== amountInLast) {
        return // skip the calcuation and update for outdated input
      }
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
    setLoading(false)
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
