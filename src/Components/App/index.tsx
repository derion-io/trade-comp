import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import './style.scss'
import 'react-toastify/dist/ReactToastify.css'
import { useListTokens } from '../../state/token/hook'
import { useWalletBalance } from '../../state/wallet/hooks/useBalances'
import { useWeb3React } from '../../state/customWeb3React/hook'
import { ToastContainer } from 'react-toastify'
import { useCurrentPoolGroup } from '../../state/currentPool/hooks/useCurrentPoolGroup'
import { useConfigs } from '../../state/config/useConfigs'
import { useResource } from '../../state/resources/hooks/useResource'
import { TIME_TO_REFRESH_STATE, TRADE_TYPE } from '../../utils/constant'
import { useSwapHistoryFormated } from '../../state/wallet/hooks/useSwapHistory'
import { Trade } from '../../pages/Trade'
import { useFetchTokenPrice } from '../../state/resources/hooks/useTokenPrice'
import { useFetchFeeData } from '../../state/resources/hooks/useFeeData'
import { PageLoadingIndicator } from '../PageLoadingIndicator'
import { ErrorBoundary } from '../ErrorBoundary'
import { useFetchListCallback } from '../../state/lists/hook/useFetchListCallback'
import { DEFAULT_LIST_OF_LISTS, UNSUPPORTED_LIST_URLS } from '../../state/lists/constants/lists'

export const App = () => {
  const { id } = useCurrentPoolGroup()
  const { tokens } = useListTokens()
  const { poolGroups } = useResource()
  const { fetchBalanceAndAllowance, updateBalanceAndAllowances } =
    useWalletBalance()
  const { account } = useWeb3React()
  const { ddlEngine, chainId, location, configs } = useConfigs()
  const chainIdRef = useRef(null)
  const { initResource } = useResource()

  useFetchFeeData()
  useFetchTokenPrice()
  useSwapHistoryFormated()
  // const fetchList = useFetchListCallback()
  // const fetchAllListsCallback = useCallback(() => {
  //   DEFAULT_LIST_OF_LISTS.forEach((url) => {
  //     const isUnsupportedList = UNSUPPORTED_LIST_URLS.includes(url)
  //     fetchList(url, isUnsupportedList).catch((error) => console.debug('interval list fetching error', error))
  //   })
  // }, [fetchList])

  // useEffect(() => {
  //   fetchAllListsCallback()
  // }, [ddlEngine, configs.name])

  useEffect(() => {
    try {
      setTimeout(() => {
        if (ddlEngine?.CURRENT_POOL && poolGroups && poolGroups[id]) {
          ddlEngine.setCurrentPool({
            ...poolGroups[id]
          })
        }
      })
    } catch (e) {
      console.error(e)
    }
  }, [ddlEngine, poolGroups, id])
  useEffect(() => {
    initResource(account)
    const intervalId = setInterval(() => {
      initResource(account)
    }, TIME_TO_REFRESH_STATE)
    return () => clearInterval(intervalId)
  }, [ddlEngine, configs.name])

  useEffect(() => {
    if (!account) {
      updateBalanceAndAllowances({
        balances: {},
        routerAllowances: {},
        maturities: {}
      })
    } else if (tokens && Object.keys(tokens).length > 0) {
      fetchBalanceAndAllowance(Object.keys(tokens))
    }
  }, [tokens, account])

  // const detectLiquidityTab = (path: string) => {
  //   if (path.includes('add-liquidity')) {
  //     return LIQUIDITY_TAB.ADD
  //   }
  //   return LIQUIDITY_TAB.REMOVE
  // }

  const detectTradeTab = (path: string) => {
    if (path.includes('long')) {
      return TRADE_TYPE.LONG
    } else if (path.includes('short')) {
      return TRADE_TYPE.SHORT
    } else if (path.includes('liquidity')) {
      return TRADE_TYPE.LIQUIDITY
    } else if (path.includes('swap')) {
      return TRADE_TYPE.SWAP
    }
    return TRADE_TYPE.LONG
  }

  // const isMatchWithPath = (path: string) => {
  //   return !!matchPath(location.pathname, {
  //     path,
  //     exact: true,
  //     strict: false
  //   })
  // }

  return (
    <div className='exposure-interface app'>
      <input type='hidden' value={chainId} ref={chainIdRef} />
      {!poolGroups ||
      !ddlEngine ||
      !configs.name ||
      Object.keys(poolGroups).length === 0 ? (
          <PageLoadingIndicator />
        ) : (
          ''
        )}
      {/* @ts-ignore */}
      <ErrorBoundary>
        <Trade
          tab={detectTradeTab(location.pathname)}
          loadingData={!poolGroups || Object.keys(poolGroups).length === 0}
        />
      </ErrorBoundary>
      <ToastContainer
        position='top-right'
        autoClose={5000}
        rtl={false}
        closeOnClick={false}
        draggable
        theme='dark'
      />
    </div>
  )
}
