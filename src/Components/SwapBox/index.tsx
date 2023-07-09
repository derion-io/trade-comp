import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Text, TextGrey } from '../ui/Text'
import './style.scss'
import 'rc-slider/assets/index.css'
import { IconArrowDown, IconOptionLeft } from '../ui/Icon'
import { Input } from '../ui/Input'
import { TokenIcon } from '../ui/TokenIcon'
import { useCurrentPoolGroup } from '../../state/currentPool/hooks/useCurrentPoolGroup'
import { useWeb3React } from '../../state/customWeb3React/hook'
import { SelectTokenModal } from '../SelectTokenModal'
import { useWalletBalance } from '../../state/wallet/hooks/useBalances'
import { useListTokens } from '../../state/token/hook'
import {
  decodeErc1155Address,
  div,
  formatFloat,
  formatPercent,
  isErc1155Address,
  weiToNumber
} from '../../utils/helpers'
import { TokenSymbol } from '../ui/TokenSymbol'
import { SkeletonLoader } from '../ui/SkeletonLoader'
import { NATIVE_ADDRESS, POOL_IDS, TRADE_TYPE } from '../../utils/constant'
import { useConfigs } from '../../state/config/useConfigs'
import formatLocalisedCompactNumber, { formatWeiToDisplayNumber } from '../../utils/formatBalance'
import isEqual from 'react-fast-compare'
import { ApproveUtrModal } from '../ApproveUtrModal'
import _ from 'lodash'
import { useCalculateSwap } from './hooks/useCalculateSwap'
import { useTokenValue } from './hooks/useTokenValue'
import { ButtonSwap } from '../ButtonSwap'
import { TxFee } from './components/TxFee'
import { PoolInfo } from './components/PoolInfo'
import { CHART_TABS } from '../../state/currentPool/type'

const Component = ({
  inputTokenAddress,
  setInputTokenAddress,
  outputTokenAddress,
  setOutputTokenAddress
}: any) => {
  const { account } = useWeb3React()
  const { configs } = useConfigs()
  const { dTokens, allTokens, id, pools, setTradeType, setChartTab } = useCurrentPoolGroup()
  const [visibleSelectTokenModal, setVisibleSelectTokenModal] = useState<boolean>(false)
  const [tokenTypeToSelect, setTokenTypeToSelect] = useState<'input' | 'output'>('input')
  const [amountIn, setAmountIn] = useState<string>('')
  const { balances, accFetchBalance } = useWalletBalance()
  const [visibleApproveModal, setVisibleApproveModal] = useState<boolean>(false)
  const { tokens } = useListTokens()
  const { callError, txFee, gasUsed, amountOut } = useCalculateSwap({
    amountIn,
    inputTokenAddress,
    outputTokenAddress
  })
  const { value: valueIn } = useTokenValue({
    amount: amountIn,
    tokenAddress: inputTokenAddress
  })
  const { value: valueOut } = useTokenValue({
    amount: amountOut,
    tokenAddress: outputTokenAddress
  })

  useEffect(() => {
    setTradeType(TRADE_TYPE.SWAP)
    setChartTab(CHART_TABS.CANDLE_CHART)
  }, [])

  useEffect(() => {
    if (!inputTokenAddress) setInputTokenAddress(NATIVE_ADDRESS || '')
    if (!outputTokenAddress) setOutputTokenAddress(dTokens[0])
  }, [id])

  const revertPairAddress = () => {
    const inAddr = inputTokenAddress
    setInputTokenAddress(outputTokenAddress)
    setOutputTokenAddress(inAddr)
  }

  const tokensToSelect = useMemo(() => {
    if (!id) return []
    const tokenRs = Object.values(pools).map((p: any) => p.TOKEN_R)
    if (tokenRs.includes(configs.addresses.wrapToken)) tokenRs.push(configs.addresses.nativeToken)
    const aTokens = allTokens.filter((a) => Number(a.split('-')[1]) === POOL_IDS.A)
    const bTokens = allTokens.filter((a) => Number(a.split('-')[1]) === POOL_IDS.B)
    const cTokens = allTokens.filter((a) => Number(a.split('-')[1]) === POOL_IDS.C)
    return _.uniq(
      [
        ...tokenRs,
        ...aTokens,
        ...bTokens,
        ...cTokens
      ].filter((address) => {
        if (tokenRs.includes(address)) return true
        if (tokenTypeToSelect === 'input' && (!balances[address] || balances[address].isZero())) {
          return false
        }
        return true
      })
    )
  }, [tokenTypeToSelect, allTokens, pools, id])

  const payoffRate = useMemo(() => {
    if (valueOut && valueIn) {
      return formatPercent(div(valueOut, valueIn), 2)
    }
    return undefined
  }, [valueIn, valueOut])

  const onSelectToken = useCallback((address: string) => {
    if ((tokenTypeToSelect === 'input' && address === outputTokenAddress) ||
      (tokenTypeToSelect === 'output' && address === inputTokenAddress)
    ) {
      revertPairAddress()
      return
    }
    if (tokenTypeToSelect === 'input') {
      setInputTokenAddress(address)
    } else {
      if (isErc1155Address(address) && isErc1155Address(inputTokenAddress)) {
        const poolOutAddress = decodeErc1155Address(address).address
        const poolOut = pools[poolOutAddress]
        const poolInAddress = decodeErc1155Address(inputTokenAddress).address
        const poolIn = pools[poolInAddress]
        if (poolInAddress !== poolOutAddress && poolOut.TOKEN_R !== poolIn.TOKEN_R) {
          setInputTokenAddress(poolOut.TOKEN_R === configs.addresses.wrapToken ? NATIVE_ADDRESS : poolOut.TOKEN_R)
        }
      }
      if (isErc1155Address(address) && !isErc1155Address(inputTokenAddress)) {
        const poolOut = pools[decodeErc1155Address(address).address]
        setInputTokenAddress(poolOut.TOKEN_R === configs.addresses.wrapToken ? NATIVE_ADDRESS : poolOut.TOKEN_R)
      }
      setOutputTokenAddress(address)
    }
  }, [pools, inputTokenAddress, outputTokenAddress, tokenTypeToSelect, configs])

  return (
    <div className='swap-box'>
      <div className='d-flex jc-space-between'>
        <Text>Swap</Text>
        <span><IconOptionLeft style={{ cursor: 'pointer' }} /></span>
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
              <Text><TokenSymbol token={inputTokenAddress} /></Text>
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
          suffix={Number(valueIn) > 0 ? <TextGrey>${formatLocalisedCompactNumber(formatFloat(valueIn))}</TextGrey> : ''}
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
              <Text><TokenSymbol token={outputTokenAddress} /></Text>
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
          suffix={Number(valueOut) > 0 ? <TextGrey>${formatLocalisedCompactNumber(formatFloat(valueOut))}</TextGrey> : ''}
          className='fs-24'
        />
      </div>

      <SelectTokenModal
        visible={visibleSelectTokenModal}
        setVisible={setVisibleSelectTokenModal}
        displayFee={tokenTypeToSelect === 'input'}
        tokens={tokensToSelect}
        onSelectToken={onSelectToken}
      />

      <PoolInfo
        outputTokenAddress={outputTokenAddress}
        inputTokenAddress={inputTokenAddress}
      />
      <TxFee gasUsed={gasUsed} payoffRate={payoffRate} />

      <div className='actions'>
        <ButtonSwap
          payoffRate={payoffRate}
          inputTokenAddress={inputTokenAddress}
          outputTokenAddress={outputTokenAddress}
          amountIn={amountIn}
          callError={callError}
          gasUsed={gasUsed}
          isSwap
          title='Swap'
        />
      </div>

      <ApproveUtrModal
        callBack={() => {
        }}
        visible={visibleApproveModal}
        setVisible={setVisibleApproveModal}
        inputTokenAddress={inputTokenAddress}
      />
    </div>
  )
}

export const SwapBox = React.memo(Component, (prevProps, nextProps) =>
  isEqual(prevProps, nextProps)
)
