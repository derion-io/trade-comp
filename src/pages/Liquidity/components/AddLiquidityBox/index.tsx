import React, { useEffect, useState } from 'react'
import { useCurrentPool } from '../../../../state/currentPool/hooks/useCurrentPool'
import { Text, TextPink } from '../../../../Components/ui/Text'
import { useListTokens } from '../../../../state/token/hook'
import { Input } from '../../../../Components/ui/Input'
import { SkeletonLoader } from '../../../../Components/ui/SkeletonLoader'
import { TokenIcon } from '../../../../Components/ui/TokenIcon'
import { TokenSymbol } from '../../../../Components/ui/TokenSymbol'
import { bn, numberToWei, parseCallStaticError, weiToNumber } from '../../../../utils/helpers'
import { formatWeiToDisplayNumber } from '../../../../utils/formatBalance'
import { SelectTokenModal } from '../../../../Components/SelectTokenModal'
import { useWalletBalance } from '../../../../state/wallet/hooks/useBalances'
import { useConfigs } from '../../../../state/config/useConfigs'
import { Box } from '../../../../Components/ui/Box'
import './style.scss'
import { ButtonExecute } from '../../../../Components/ui/Button'
import { IconArrowDown } from '../../../../Components/ui/Icon'
import { POOL_IDS } from '../../../../utils/constant'
import { BigNumber } from 'ethers'
import { useMultiSwapAction } from '../../../../hooks/useMultiSwapAction'

export const AddLiquidityBox = ({ totalSupplyCP }: {totalSupplyCP: BigNumber}) => {
  const { cToken, baseToken, poolAddress, states, quoteToken, logicAddress } = useCurrentPool()
  const { tokens } = useListTokens()
  const { balances, routerAllowances, approveRouter } = useWalletBalance()
  const [amountIn, setAmountIn] = useState<string>()
  const [amountOut, setAmountOut] = useState<string>()
  const [tokenAdd, setTokenAdd] = useState<string>('')
  const [callError, setCallError] = useState<string>('')
  const [txFee, setTxFee] = useState<BigNumber>(bn(0))

  const [visibleSelectTokenModal, setVisibleSelectTokenModal] = useState<boolean>(false)
  const { configs } = useConfigs()
  const { multiSwap, calculateAmountOuts } = useMultiSwapAction()

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

  const calcAmountOut = async () => {
    if (!amountOut) {
      setCallError('Calculating...')
    }
    calculateAmountOuts([{
      tokenIn: tokenAdd,
      tokenOut: poolAddress + '-' + POOL_IDS.cp,
      amountIn: bn(numberToWei(amountIn, tokens[tokenAdd]?.decimal || 18))
    }], false).then((res) => {
      const [aOuts, gasLeft] = res
      console.log(aOuts)
      setAmountOut(weiToNumber(aOuts[0]?.amountOut || 0, tokens[poolAddress + '-' + POOL_IDS.cp].decimal || 18))
      // @ts-ignore
      setTxFee(detectTxFee(gasLeft))
      // @ts-ignore
      setCallError('')
    }).catch((e) => {
      const error = parseCallStaticError(e)
      setAmountOut('0')
      setTxFee(bn(0))
      setCallError(error ?? e)
      console.log(e)
    })
  }

  const detectTxFee = (gasUsed: BigNumber) => {
    return gasUsed.mul(2).div(3).mul(5 * 10 ** 9)
  }

  return <div className='add-liquidity-box'>
    <div className='text-center mb-1'><Text>Add Liquidity</Text></div>
    <div className='text-center mb-1'>
      <TextPink>{tokens[cToken]?.symbol}_{tokens[baseToken]?.symbol}_{tokens[quoteToken]?.symbol}</TextPink>
    </div>
    <div className='mb-1'>
      <InfoRow className='mb-1'>
        <SkeletonLoader loading={!tokens[tokenAdd]}>
          <span
            className='add-liquidity__token'
            onClick={(address) => {
              setVisibleSelectTokenModal(true)
            }}
          >
            <TokenIcon size={24} tokenAddress={tokenAdd} className='mr-05' />
            <Text><TokenSymbol token={tokens[tokenAdd]} /></Text>
          </span>
        </SkeletonLoader>
        <SkeletonLoader loading={!balances[tokenAdd]}>
          <Text
            className='amount-input-box__head--balance'
            onClick={() => {
              setAmountIn(weiToNumber(balances[tokenAdd], tokens[tokenAdd]?.decimal || 18))
            }}
          >Balance: {balances && balances[tokenAdd]
              ? formatWeiToDisplayNumber(
                balances[tokenAdd],
                4,
              tokens[tokenAdd]?.decimal || 18
              )
              : 0
            }
          </Text>
        </SkeletonLoader>
      </InfoRow>
      <Input
        placeholder='0.0'
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
      <span className='add-liquidity__arrow-down'>
        <IconArrowDown fill='#01A7FA' />
      </span>
    </div>
    <div className='mb-1'>
      <InfoRow className='mb-1'>
        <SkeletonLoader loading={!tokens[tokenAdd]}>
          <span
            className='add-liquidity__token'
          >
            <TokenIcon size={24} tokenAddress={poolAddress + '-' + POOL_IDS.cp} className='mr-05' />
            <Text><TokenSymbol token={tokens[poolAddress + '-' + POOL_IDS.cp]} /></Text>
          </span>
        </SkeletonLoader>
        <SkeletonLoader loading={!balances[tokenAdd]}>
          <Text
            className='amount-input-box__head--balance'
          >Balance: {balances && balances[poolAddress + '-' + POOL_IDS.cp]
              ? formatWeiToDisplayNumber(
                balances[poolAddress + '-' + POOL_IDS.cp],
                4
              )
              : 0
            }
          </Text>
        </SkeletonLoader>
      </InfoRow>
      <Input
        placeholder='0.0'
        className='fs-24'
        // @ts-ignore
        value={amountOut}
      />
    </div>
    <Box borderColor='#3a3a3a' className='add-liquidity__info-box mb-1'>
      <InfoRow>
        <Text>Transaction Fee</Text>
        <Text>3%</Text>
      </InfoRow>
      <InfoRow>
        <Text>TRC</Text>
        <Text>1.5</Text>
      </InfoRow>
      <InfoRow>
        <Text>Share of pool</Text>
        <Text>3%</Text>
      </InfoRow>
    </Box>
    <div>
      <ButtonExecute className='add-liquidity__action'>Add liquidity</ButtonExecute>
    </div>
    <SelectTokenModal
      visible={visibleSelectTokenModal}
      setVisible={setVisibleSelectTokenModal}
      tokens={[
        cToken,
        baseToken,
        quoteToken
      ]}
      onSelectToken={(address: string) => {
        setTokenAdd(address)
      }}
    />
  </div>
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
