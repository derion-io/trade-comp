import React, { useEffect, useMemo, useState } from 'react'
import { useCurrentPoolGroup } from '../../../../state/currentPool/hooks/useCurrentPoolGroup'
import { Text, TextGrey, TextPink } from '../../../../Components/ui/Text'
import { useListTokens } from '../../../../state/token/hook'
import { Input } from '../../../../Components/ui/Input'
import { SkeletonLoader } from '../../../../Components/ui/SkeletonLoader'
import { TokenIcon } from '../../../../Components/ui/TokenIcon'
import { TokenSymbol } from '../../../../Components/ui/TokenSymbol'
import {
  bn,
  decodeErc1155Address,
  formatFloat,
  WEI,
  parseCallStaticError,
  IEW,
  zerofy
} from '../../../../utils/helpers'
import { SelectTokenModal } from '../../../../Components/SelectTokenModal'
import { useWalletBalance } from '../../../../state/wallet/hooks/useBalances'
import { Box } from '../../../../Components/ui/Box'
import './style.scss'
import { ButtonExecute } from '../../../../Components/ui/Button'
import { POOL_IDS } from '../../../../utils/constant'
import { BigNumber } from 'ethers'
import { useWeb3React } from '../../../../state/customWeb3React/hook'
import Slider from 'rc-slider'
import { useNativePrice } from '../../../../hooks/useTokenPrice'
import { useConfigs } from '../../../../state/config/useConfigs'
import NumberInput from '../../../../Components/ui/Input/InputNumber'

const shareOfPoolUnit = 1000
const percentUnit = 1000

export const RemoveLiquidityBox = ({
  totalSupplyCP
}: {
  totalSupplyCP: BigNumber
}) => {
  const { account, showConnectModal } = useWeb3React()
  const { ddlEngine, chainId } = useConfigs()
  const { cToken, baseToken, poolAddress, quoteToken, logicAddress } =
    useCurrentPoolGroup()
  const { tokens } = useListTokens()
  const { balances, routerAllowances, approveRouter } = useWalletBalance()
  const [loading, setLoading] = useState<boolean>(false)
  const [amountIn, setAmountIn] = useState<string>()
  const [amountOut, setAmountOut] = useState<string>()
  const [tokenAdd, setTokenAdd] = useState<string>('')
  const [callError, setCallError] = useState<string>('')
  const [percent, setPercent] = useState<number>(0)
  const [txFee, setTxFee] = useState<BigNumber>(bn(0))
  const [visibleSelectTokenModal, setVisibleSelectTokenModal] =
    useState<boolean>(false)
  const { data: nativePrice } = useNativePrice()

  useEffect(() => {
    setTokenAdd(cToken || '')
  }, [logicAddress])

  useEffect(() => {
    if (tokens[tokenAdd] && amountIn && Number(amountIn)) {
      calcAmountOut()
    } else if (Number(amountIn) === 0) {
      setAmountOut('')
      setTxFee(bn(0))
      setAmountOut('')
    }
  }, [tokens[tokenAdd], amountIn])

  const cpAddress = useMemo(() => {
    return poolAddress + '-' + POOL_IDS.cp
  }, [poolAddress])

  useEffect(() => {
    setAmountIn(
      IEW(
        bn(WEI(percent || 0))
          .mul(balances[cpAddress] || 0)
          .div(100),
        36
      )
    )
  }, [balances[cpAddress]])

  const shareOfPool = useMemo(() => {
    const amountOutBn = bn(WEI(amountIn || '0'))
    if (totalSupplyCP.sub(amountOutBn).isZero()) return 0

    return (
      (balances[cpAddress] || bn(0))
        .sub(amountOutBn)
        .mul(100 * shareOfPoolUnit)
        .div(totalSupplyCP.sub(amountOutBn))
        .toNumber() / shareOfPoolUnit
    )
  }, [amountOut, totalSupplyCP, balances[cpAddress]])

  const calcAmountOut = async () => {
    if (!amountOut) {
      setCallError('Calculating...')
    }
    // @ts-ignore
    ddlEngine.SWAP.calculateAmountOuts(
      [
        {
          tokenIn: tokenAdd,
          tokenOut: poolAddress + '-' + POOL_IDS.cp,
          amountIn: bn(WEI(amountIn, tokens[tokenAdd]?.decimals || 18))
        }
      ],
      false
    )
      .then((res) => {
        const [aOuts, gasLeft] = res
        setAmountOut(
          IEW(
            aOuts[0]?.amountOut || 0,
            tokens[poolAddress + '-' + POOL_IDS.cp].decimals || 18
          )
        )
        // @ts-ignore
        setTxFee(detectTxFee(gasLeft))
        // @ts-ignore
        setCallError('')
      })
      .catch((e) => {
        const error = parseCallStaticError(e)
        setAmountOut('0')
        setTxFee(bn(0))
        setCallError(error ?? e)
        console.error(e)
      })
  }

  const detectTxFee = (gasUsed: BigNumber) => {
    return gasUsed
      .mul(2)
      .div(3)
      .mul(5 * 10 ** 9)
  }

  const renderExecuteButton = () => {
    const address = decodeErc1155Address(tokenAdd).address

    if (!tokens[tokenAdd] || loading) {
      return (
        <ButtonExecute className='add-liquidity__action' disabled>
          Waiting for Confirmation...
        </ButtonExecute>
      )
    } else if (!account) {
      return (
        <ButtonExecute
          onClick={() => {
            showConnectModal()
          }}
          className='add-liquidity__action'
        >
          Connect Wallet
        </ButtonExecute>
      )
    } else if (Number(amountIn) === 0) {
      return (
        <ButtonExecute className='add-liquidity__action' disabled>
          Enter Amount
        </ButtonExecute>
      )
    } else if (
      !balances[tokenAdd] ||
      balances[tokenAdd].lt(WEI(amountIn || 0, tokens[tokenAdd]?.decimals || 18))
    ) {
      return (
        <ButtonExecute className='add-liquidity__action' disabled>
          {' '}
          Insufficient {tokens[tokenAdd].symbol} Amount{' '}
        </ButtonExecute>
      )
    } else if (
      !routerAllowances[address] ||
      routerAllowances[address].lt(
        WEI(amountIn || 0, tokens[tokenAdd]?.decimals || 18)
      )
    ) {
      return (
        <ButtonExecute
          className='add-liquidity__action'
          onClick={async () => {
            setLoading(true)
            await approveRouter({ tokenAddress: tokenAdd })
            setLoading(false)
          }}
        >
          Approve
        </ButtonExecute>
      )
    } else if (callError) {
      return (
        <ButtonExecute className='add-liquidity__action' disabled>
          {callError}
        </ButtonExecute>
      )
    } else {
      return (
        <ButtonExecute
          className='add-liquidity__action'
          onClick={async () => {
            setLoading(true)
            // @ts-ignore
            await ddlEngine.SWAP.multiSwap(
              [
                {
                  tokenIn: cpAddress,
                  tokenOut: cToken,
                  amountIn: bn(WEI(amountIn, tokens[cpAddress]?.decimals || 18)),
                  amountOutMin: 0
                }
              ]
            )
            setAmountIn('')
            setAmountIn('')
            setLoading(false)
          }}
        >
          Remove liquidity
        </ButtonExecute>
      )
    }
  }

  const amountToPercent = (amount: number): number => {
    return (
      bn(WEI(amount || 0))
        .mul(100 * percentUnit)
        .div(balances[cpAddress] || 0)
        .toNumber() / percentUnit
    )
  }

  const percentToAmount = (percent: number): string => {
    return IEW(
      bn(WEI(percent || 0))
        .mul(balances[cpAddress] || 0)
        .div(100),
      36
    )
  }

  return (
    <div className='add-liquidity-box'>
      <div className='text-center mb-1'>
        <Text>Remove Liquidity</Text>
      </div>
      <div className='text-center mb-1'>
        <TextPink>
          {tokens[cToken]?.symbol}_{tokens[baseToken]?.symbol}_
          {tokens[quoteToken]?.symbol}
        </TextPink>
      </div>
      <div>
        <InfoRow className='mb-1'>
          <SkeletonLoader loading={!tokens[cpAddress]}>
            <span className='add-liquidity__token'>
              <span className='mr-05'>
                <TokenIcon size={24} tokenAddress={cpAddress} />
              </span>
              <Text>
                <TokenSymbol token={cpAddress} />
              </Text>
            </span>
          </SkeletonLoader>
          <SkeletonLoader loading={!balances[cpAddress]}>
            <Text
              className='amount-input-box__head--balance cursor-pointer'
              onClick={() => {
                const balance = IEW(
                  balances[cpAddress],
                  tokens[cpAddress]?.decimals || 18
                )
                setAmountIn(balance)
                setPercent(100)
              }}
            >
              {'Balance: '}
              {zerofy(
                formatFloat(
                  IEW(
                    balances?.[cpAddress] ?? 0,
                    tokens[cpAddress]?.decimals ?? 18
                  )
                )
              )}
            </Text>
          </SkeletonLoader>
        </InfoRow>
        <NumberInput
          placeholder='0.0'
          className='fs-24'
          // @ts-ignore
          value={amountIn}
          onValueChange={(e) => {
            // @ts-ignore
            if (Number(e.target.value) >= 0) {
              setAmountIn((e.target as HTMLInputElement).value)
              setPercent(
                amountToPercent(Number((e.target as HTMLInputElement).value))
              )
            }
          }}
        />
        <div className='mb-2 p-1'>
          <Slider
            min={0}
            max={100}
            step={0.1}
            count={1}
            value={percent}
            onChange={(e: number) => {
              setAmountIn(percentToAmount(e))
              setPercent(e)
            }}
            dotStyle={{
              background: '#303236',
              borderRadius: '2px',
              width: '1px',
              borderColor: '#303236',
              borderWidth: '2px',
              bottom: '-1px'
            }}
            trackStyle={{ backgroundColor: '#03c3ff', height: 2 }}
            handleStyle={{
              backgroundColor: 'white',
              borderColor: '#03c3ff',
              borderWidth: '2px'
            }}
            activeDotStyle={{
              borderColor: '#03c3ff'
            }}
            marks={{ 0: 0, 25: 25, 50: 50, 75: 75, 100: 100 }}
            railStyle={{ backgroundColor: '#303236', height: '2px' }}
          />
        </div>
      </div>

      <Box
        borderColor='default'
        className='add-liquidity__info-box mb-1'
        title='Info'
      >
        <InfoRow>
          <Text>Receive</Text>
          <Text>
            <Text>{formatFloat(amountOut || 0, 4)} </Text>
            <TextPink>
              <TokenSymbol token={cToken} />
            </TextPink>
          </Text>
        </InfoRow>
        <InfoRow>
          <Text>Transaction Fee</Text>
          <Text>
            {IEW(txFee, 18, 4)}
            <TextGrey> {chainId === 56 ? 'BNB' : 'ETH'} </TextGrey>
            (${IEW(txFee.mul(WEI(nativePrice)), 36, 2)})
          </Text>
        </InfoRow>
        <InfoRow>
          <Text>Share of pool</Text>
          <Text>{shareOfPool}%</Text>
        </InfoRow>
      </Box>
      <div className='actions'>{renderExecuteButton()}</div>
      <SelectTokenModal
        visible={visibleSelectTokenModal}
        setVisible={setVisibleSelectTokenModal}
        tokens={[cToken, baseToken, quoteToken]}
        onSelectToken={(address: string) => {
          setTokenAdd(address)
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
