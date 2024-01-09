import React, { useEffect, useRef } from 'react'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { Trade } from '../../pages/Trade'
import { useConfigs } from '../../state/config/useConfigs'
import { useCurrentPoolGroup } from '../../state/currentPool/hooks/useCurrentPoolGroup'
import { useWeb3React } from '../../state/customWeb3React/hook'
import { useFetchFeeData } from '../../state/resources/hooks/useFeeData'
import { useResource } from '../../state/resources/hooks/useResource'
import { useFetchTokenPrice } from '../../state/resources/hooks/useTokenPrice'
import { useListTokens } from '../../state/token/hook'
import { useWalletBalance } from '../../state/wallet/hooks/useBalances'
import { useSwapHistoryFormated } from '../../state/wallet/hooks/useSwapHistory'
import { TRADE_TYPE } from '../../utils/constant'
import { ErrorBoundary } from '../ErrorBoundary'
import { PageLoadingIndicator } from '../PageLoadingIndicator'
import './style.scss'
import { detectTradeTab } from '../../utils/helpers'

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
    // initResource(account)
    // const intervalId = setInterval(() => {
    //   initResource(account)
    // }, TIME_TO_REFRESH_STATE)
    // return () => clearInterval(intervalId)
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
