import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Text, TextGrey } from '../ui/Text'
import './style.scss'
import 'rc-slider/assets/index.css'
import { IconArrowDown } from '../ui/Icon'
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
  isErc1155Address,
  IEW,
  zerofy,
  NUM
} from '../../utils/helpers'
import { TokenSymbol } from '../ui/TokenSymbol'
import { SkeletonLoader } from '../ui/SkeletonLoader'
import { NATIVE_ADDRESS, POOL_IDS, TRADE_TYPE } from '../../utils/constant'
import { useConfigs } from '../../state/config/useConfigs'
import { formatLocalisedCompactNumber } from '../../utils/formatBalance'
import isEqual from 'react-fast-compare'
import _ from 'lodash'
import { useCalculateSwap } from './hooks/useCalculateSwap'
import { useTokenValue } from './hooks/useTokenValue'
import { ButtonSwap } from '../ButtonSwap'
import { TxFee } from './components/TxFee'
import { PoolInfo } from './components/PoolInfo'
import { CHART_TABS } from '../../state/currentPool/type'
import { useCurrentPool } from '../../state/currentPool/hooks/useCurrentPool'

const Component = ({
  inputTokenAddress,
  setInputTokenAddress,
  outputTokenAddress,
  setOutputTokenAddress,
  tokenOutMaturity
}: any) => {
  const { account } = useWeb3React()
  const { configs } = useConfigs()
  const { dTokens, allTokens, id, pools, setTradeType, setChartTab } =
    useCurrentPoolGroup()
  const [visibleSelectTokenModal, setVisibleSelectTokenModal] =
    useState<boolean>(false)
  const [tokenTypeToSelect, setTokenTypeToSelect] = useState<
    'input' | 'output'
  >('input')
  const [amountIn, setAmountIn] = useState<string>('')
  const { setCurrentPoolAddress } = useCurrentPool()
  const { balances, accFetchBalance } = useWalletBalance()
  const { tokens } = useListTokens()
  const { callError, gasUsed, amountOut, payloadAmountIn } = useCalculateSwap({
    amountIn,
    setAmountIn,
    inputTokenAddress,
    outputTokenAddress,
    tokenOutMaturity
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
    console.log(id, inputTokenAddress, outputTokenAddress)
    if (!inputTokenAddress) setInputTokenAddress(NATIVE_ADDRESS)
    if (!outputTokenAddress) {
      setOutputTokenAddress(dTokens?.[0] ?? NATIVE_ADDRESS)
    }
    if (inputTokenAddress === outputTokenAddress) {
      if (outputTokenAddress !== NATIVE_ADDRESS) {
        setOutputTokenAddress(NATIVE_ADDRESS)
      } else {
        setOutputTokenAddress(dTokens?.[0] ?? NATIVE_ADDRESS)
      }
    }
  }, [id, inputTokenAddress, outputTokenAddress])

  const revertPairAddress = () => {
    const inAddr = inputTokenAddress
    setInputTokenAddress(outputTokenAddress)
    setOutputTokenAddress(inAddr)
  }

  const tokensToSelect = useMemo(() => {
    if (!id) return []
    const tokenRs = Object.values(pools).map((p: any) => p.TOKEN_R)
    if (tokenRs.includes(configs.wrappedTokenAddress)) {
      tokenRs.push(configs.wrappedTokenAddress)
    }
    const aTokens = allTokens.filter(
      (a) => Number(a.split('-')[1]) === POOL_IDS.A
    )
    const bTokens = allTokens.filter(
      (a) => Number(a.split('-')[1]) === POOL_IDS.B
    )
    const cTokens = allTokens.filter(
      (a) => Number(a.split('-')[1]) === POOL_IDS.C
    )
    return _.uniq(
      [...tokenRs, ...aTokens, ...bTokens, ...cTokens].filter((address) => {
        if (tokenRs.includes(address)) return true
        if (
          tokenTypeToSelect === 'input' &&
          (!balances[address] || balances[address].isZero())
        ) {
          return false
        }
        return true
      })
    )
  }, [tokenTypeToSelect, allTokens, pools, id])

  const payoffRate = useMemo(() => {
    if (valueOut && valueIn && Number(valueOut) && Number(valueIn)) {
      return NUM(div(valueOut, valueIn))
    }
    return undefined
  }, [valueIn, valueOut])

  const onSelectToken = useCallback(
    (address: string) => {
      if (
        (tokenTypeToSelect === 'input' && address === outputTokenAddress) ||
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
          if (
            poolInAddress !== poolOutAddress &&
            poolOut.TOKEN_R !== poolIn.TOKEN_R
          ) {
            setInputTokenAddress(
              poolOut.TOKEN_R === configs.wrappedTokenAddress
                ? NATIVE_ADDRESS
                : poolOut.TOKEN_R
            )
          }
        }
        if (isErc1155Address(address) && !isErc1155Address(inputTokenAddress)) {
          const poolOut = pools[decodeErc1155Address(address).address]
          setInputTokenAddress(
            poolOut.TOKEN_R === configs.wrappedTokenAddress
              ? NATIVE_ADDRESS
              : poolOut.TOKEN_R
          )
        }
        setOutputTokenAddress(address)
      }
    },
    [pools, inputTokenAddress, outputTokenAddress, tokenTypeToSelect, configs]
  )
  useMemo(() => {
    if (isErc1155Address(inputTokenAddress)) {
      setCurrentPoolAddress(decodeErc1155Address(inputTokenAddress).address)
    } else if (!isErc1155Address(inputTokenAddress)) {
      setCurrentPoolAddress(decodeErc1155Address(outputTokenAddress).address)
    }
  }, [outputTokenAddress, inputTokenAddress])
  return (
    <div className='swap-box'>
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
              <Text>
                <TokenSymbol token={inputTokenAddress} />
              </Text>
            </span>
          </SkeletonLoader>
          <div className='d-flex align-item-center'>
            <SkeletonLoader loading={accFetchBalance !== account && account}>
              <Text
                className='amount-input-box__head--balance'
                onClick={() => {
                  setAmountIn(
                    IEW(
                      balances[inputTokenAddress],
                      tokens[inputTokenAddress]?.decimal || 18
                    )
                  )
                }}
              >
                {'Balance: '}
                {zerofy(
                  formatFloat(
                    IEW(
                      balances?.[inputTokenAddress] ?? 0,
                      tokens[inputTokenAddress]?.decimal ?? 18
                    )
                  )
                )}
              </Text>
            </SkeletonLoader>
          </div>
        </div>
        <Input
          placeholder='0.0'
          isNumber
          suffix={
            Number(valueIn) > 0 ? (
              <TextGrey>
                ${formatLocalisedCompactNumber(formatFloat(valueIn))}
              </TextGrey>
            ) : (
              ''
            )
          }
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
        <span
          className='arrow-down'
          onClick={() => {
            revertPairAddress()
          }}
        >
          <IconArrowDown fill='#01A7FA' />
        </span>
      </div>

      <div className='amount-input-box'>
        <div className='amount-input-box__head'>
          <SkeletonLoader loading={!tokens[inputTokenAddress]}>
            <span
              className='current-token'
              onClick={() => {
                setVisibleSelectTokenModal(true)
                setTokenTypeToSelect('output')
              }}
            >
              <TokenIcon size={24} tokenAddress={outputTokenAddress} />
              <Text>
                <TokenSymbol token={outputTokenAddress} />
              </Text>
            </span>
          </SkeletonLoader>
          <SkeletonLoader loading={accFetchBalance !== account && account}>
            <Text>
              {'Balance: '}
              {zerofy(
                formatFloat(
                  IEW(
                    balances?.[outputTokenAddress] ?? 0,
                    tokens[outputTokenAddress]?.decimal ?? 18
                  )
                )
              )}
            </Text>
          </SkeletonLoader>
        </div>
        <Input
          // @ts-ignore
          value={Number(amountOut) > 0 ? amountOut : ''}
          placeholder='0.0'
          isNumber
          suffix={
            Number(valueOut) > 0 ? (
              <TextGrey>
                ${formatLocalisedCompactNumber(formatFloat(valueOut))}
              </TextGrey>
            ) : (
              ''
            )
          }
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
          payloadAmountIn={payloadAmountIn}
          inputTokenAddress={inputTokenAddress}
          outputTokenAddress={outputTokenAddress}
          amountIn={amountIn}
          amountOut={amountOut}
          callError={callError}
          gasUsed={gasUsed}
          tokenOutMaturity={tokenOutMaturity}
          title='Swap'
        />
      </div>
    </div>
  )
}

export const SwapBox = React.memo(Component, (prevProps, nextProps) =>
  isEqual(prevProps, nextProps)
)
