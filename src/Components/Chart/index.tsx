import React, { useEffect, useState } from 'react'
import isEqual from 'react-fast-compare'
import { useNativePrice } from '../../hooks/useTokenPrice'
import { useConfigs } from '../../state/config/useConfigs'
import { useCurrentPool } from '../../state/currentPool/hooks/useCurrentPool'
import { useCurrentPoolGroup } from '../../state/currentPool/hooks/useCurrentPoolGroup'
import { CHART_TABS } from '../../state/currentPool/type'
import { useResource } from '../../state/resources/hooks/useResource'
import { useListTokens } from '../../state/token/hook'
import { POOL_IDS, TRADE_TYPE, ZERO_ADDRESS } from '../../utils/constant'
import {
  bn,
  detectTradeTab,
  formatFloat,
  unwrap,
  zerofy,
} from '../../utils/helpers'
import { PoolSearch } from '../../utils/type'
import { CandleChart } from '../CandleChart'
import { FunctionPlot } from '../FuncPlot'
import { LineChart } from '../LineChart'
import { SearchIndexModal } from '../searchIndexModal'
import { Card } from '../ui/Card'
import { Tabs } from '../ui/Tabs'
import { Text, TextBuy, TextSell } from '../ui/Text'
import './style.scss'
import { TokenIcon } from '../ui/TokenIcon'
import { useWindowSize } from '../../hooks/useWindowSize'
import { useWalletBalance } from '../../state/wallet/hooks/useBalances'
import { useSettings } from '../../state/setting/hooks/useSettings'
const Component = ({
  changedIn24h,
  inputTokenAddress,
  outputTokenAddress,
  setInputTokenAddress,
  setOutputTokenAddress,
}: {
  changedIn24h: number
  inputTokenAddress: string
  outputTokenAddress: string
  setInputTokenAddress: (address: string) => void
  setOutputTokenAddress: (address: string) => void
}) => {
  const { chainId, configs, location } = useConfigs()
  const { chartTab, setChartTab, basePrice, id, chartIsOutDate } =
    useCurrentPoolGroup()
  const { data: nativePrice } = useNativePrice()
  const { width } = useWindowSize()
  const isPhone = width && width < 768
  const {
    settings: { minPositionValueUSD }
  } = useSettings()

  const { currentPool, priceByIndexR } = useCurrentPool()
  const { tokens } = useListTokens()
  const { balances } = useWalletBalance()
  const [onSearchCurrenies, setOnSearchCurrenies] = useState<boolean>(false)
  const { poolGroups, useCalculatePoolGroupsValue } = useResource()
  const { poolGroupsValue } = useCalculatePoolGroupsValue()
  const [isUseDextool, setUseDexTool] = useState<boolean>(false)
  const pairAddress = poolGroups[id]
    ? '0x' +
      (poolGroups[id]?.ORACLE as String).slice(
        poolGroups[id]?.ORACLE.length - 40,
        poolGroups[id]?.ORACLE.length
      )
    : ''
  useEffect(() => {
    console.log('#chartIsOutDate', chartIsOutDate)
    // if (currentPool?.chartIsOutDate) {
    //   setUseDexTool(true)
    // }
    if (chartIsOutDate) {
      setUseDexTool(true)
    }
  }, [chartIsOutDate])
  useEffect(() => {
    setUseDexTool(false)
  }, [chainId])
  return (
    <div className='chart-box'>
      <div className='chart__head'>
        <div className='chart__head--left'>
          <SearchIndexModal
            visible={onSearchCurrenies}
            setVisible={() => {
              setOnSearchCurrenies(!onSearchCurrenies)
            }}
            onDismiss={() => {}}
            onPoolSelect={(
              pool: PoolSearch,
              hasWarning?: boolean | undefined
            ) => {
              const { poolAddress } = pool.pools?.[0]
              const tab = detectTradeTab(location.pathname)
              if (pool && poolAddress) {
                if (tab === TRADE_TYPE.LONG) {
                  setOutputTokenAddress(poolAddress + '-' + POOL_IDS.A)
                } else if (tab === TRADE_TYPE.SHORT) {
                  setOutputTokenAddress(poolAddress + '-' + POOL_IDS.B)
                } else if (tab === TRADE_TYPE.LIQUIDITY) {
                  setOutputTokenAddress(poolAddress + '-' + POOL_IDS.C)
                }
              }
            }}
          />
          <div className='select-pool-group'>
            <div
              className='select-pool-group__option noselect active'
              onClick={() => {
                setOnSearchCurrenies(true)
              }}
            >
              {' '}
              <span>
                {unwrap(tokens[poolGroups?.[id]?.baseToken]?.symbol)}/
                {unwrap(tokens[poolGroups?.[id]?.quoteToken]?.symbol)}
              </span>
              {(
                (isPhone
                  ? poolGroupsValue?.[id]?.poolGroupPositions?.slice(0, 3)
                  : poolGroupsValue?.[id]?.poolGroupPositions) || []
              ).map((playingToken: any) => {
                const { address, value } = playingToken
                if (value < minPositionValueUSD) return null
                if (balances[address] && bn(balances[address]).gt(0)) {
                  return (
                    <TokenIcon key={address} size={20} tokenAddress={address} />
                  )
                } else {
                  return null
                }
              })}
            </div>
          </div>
          {!!id && basePrice && (
            <span>
              <Text>
                {priceByIndexR &&
                [
                  configs.wrappedTokenAddress,
                  ...Object.keys(configs.tokens || {})
                ].includes(currentPool?.quoteToken)
                  ? zerofy(formatFloat(basePrice))
                  : '$' +
                    zerofy(
                      formatFloat(basePrice) *
                        (currentPool?.quoteToken === configs.wrappedTokenAddress
                          ? nativePrice
                          : 1)
                    )}
              </Text>
              {changedIn24h > 0 ? (
                <TextBuy>(+{changedIn24h}%)</TextBuy>
              ) : (
                <TextSell>({changedIn24h}%)</TextSell>
              )}
            </span>
          )}
        </div>
        {chainId !== 1337 && (
          <Tabs
            tab={chartTab}
            setTab={setChartTab}
            tabs={[
              { name: 'Candles', value: CHART_TABS.CANDLE_CHART },
              { name: 'Lines', value: CHART_TABS.LINE_CHART },
              { name: 'Curves', value: CHART_TABS.FUNC_PLOT }
            ]}
          />
        )}
      </div>
      {/* {tab === CANDLE_CHART && configs.candleChartApi ? (
        <CandleChart />
      ) : (
        <div />
      )} */}
      <div className='chart-wrap ergawe'>
        {chainId !== 1337 &&
          // @ts-ignore
          (chartTab === CHART_TABS.LINE_CHART && configs.subGraph ? (
            <LineChart changedIn24h={changedIn24h} />
          ) : chartTab === CHART_TABS.FUNC_PLOT ? (
            currentPool?.states && <FunctionPlot />
          ) : isUseDextool ? (
            <DexToolChart pairAddress={pairAddress} chartResolution='1' />
          ) : (
            <CandleChart />
          ))}
      </div>
    </div>
  )
}
export const DexToolChart = (props: { pairAddress: string | undefined, chartResolution: string }) => {
  const { configs } = useConfigs()
  const dextoolsID = configs?.dextoolsID ?? configs?.gtID ?? 'ethereum'
  const pair = props?.pairAddress?.toLowerCase() ?? ZERO_ADDRESS
  const chartResolution = props.chartResolution || '1'
  return (
    <Card className='candle-chart-wrap' >
      { props.pairAddress
        ? <div
          className='candle-chart-box'
        >
          <iframe id='dextools-widget'
            title='DEXTools Trading Chart'
            style={{
              width: '100%',
              height: 'calc(100% + 40px)',
              position: 'absolute',
              top: '-40px',
              border: 'none'
            }}
            src={`https://www.dextools.io/widget-chart/en/${dextoolsID}/pe-light/${pair}?theme=dark&tvPlatformColor=1b1d21&tvPaneColor=131722&chartType=1&chartResolution=${chartResolution}&drawingToolbars=false`} />
        </div>
        : 'Dextools Loading'}
    </Card>
  )
}
export const Chart = React.memo(Component, (prevProps, nextProps) =>
  isEqual(prevProps, nextProps)
)
