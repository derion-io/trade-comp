import React, { useEffect, useRef } from 'react'
import './style.scss'
import 'react-toastify/dist/ReactToastify.css'
import { matchPath } from 'react-router-dom'
import { useListTokens } from '../../state/token/hook'
import { useWalletBalance } from '../../state/wallet/hooks/useBalances'
import { useWeb3React } from '../../state/customWeb3React/hook'
import { ToastContainer } from 'react-toastify'
import { useCurrentPool } from '../../state/currentPool/hooks/useCurrentPool'
import { useConfigs } from '../../state/config/useConfigs'
import { useListPool } from '../../state/resources/hooks/useListPool'
import { Pools } from '../../pages/Pools'
import { SWAP_TAB, TIME_TO_REFRESH_STATE } from '../../utils/constant'
import { useSwapHistoryFormated } from '../../state/wallet/hooks/useSwapHistory'
import { Trade } from '../../pages/Trade'
import { useFetchTokenPrice } from '../../state/resources/hooks/useTokenPrice'

export const App = () => {
  const { id } = useCurrentPool()
  const { tokens } = useListTokens()
  const { poolGroups } = useListPool()
  const { fetchBalanceAndAllowance } = useWalletBalance()
  const { account } = useWeb3React()
  const { ddlEngine, chainId, location } = useConfigs()
  const chainIdRef = useRef(null)
  const { initListPool } = useListPool()
  useFetchTokenPrice()
  useSwapHistoryFormated()

  useEffect(() => {
    try {
      setTimeout(() => {
        if (ddlEngine?.CURRENT_POOL && poolGroups[id]) {
          // @ts-ignore
          ddlEngine.setCurrentPool({
            ...poolGroups[id]
          })
        }
      })
    } catch (e) {
      console.log(e)
    }
  }, [ddlEngine, poolGroups, id])

  useEffect(() => {
    initListPool(account)
    const intervalId = setInterval(() => {
      initListPool(account)
    }, TIME_TO_REFRESH_STATE)
    return () => clearInterval(intervalId)
  }, [chainId, account])

  useEffect(() => {
    if (account && Object.keys(tokens).length > 0) {
      fetchBalanceAndAllowance(Object.keys(tokens))
    }
  }, [account, tokens])

  const renderAppContent = () => {
    switch (true) {
      case isMatchWithPath('/:tab(long|short|swap)/:pool?'):
        return <Trade tab={detectTradeTab(location.pathname)} pool={detectPool(location.pathname)}/>
      case isMatchWithPath('/pools'):
        return <Pools />
      // case isMatchWithPath('/:tab(add-liquidity|remove-liquidity)'):
      //   return <Liquidity tab={detectLiquidityTab(location.pathname)} />
      default:
        return <Trade tab={SWAP_TAB.SWAP} />
    }
  }

  // const detectLiquidityTab = (path: string) => {
  //   if (path.includes('add-liquidity')) {
  //     return LIQUIDITY_TAB.ADD
  //   }
  //   return LIQUIDITY_TAB.REMOVE
  // }

  const detectTradeTab = (path: string) => {
    if (path.includes('long')) {
      return SWAP_TAB.LONG
    } else if (path.includes('short')) {
      return SWAP_TAB.SHORT
    }
    return SWAP_TAB.SWAP
  }

  const detectPool = (path: string) => {
    if (path.includes('long') || path.includes('short') || path.includes('swap')) {
      const arr = path.split('/')
      return arr[arr.length - 1]
    }
    return ''
  }

  const isMatchWithPath = (path: string) => {
    return !!matchPath(location.pathname, {
      path,
      exact: true,
      strict: false
    })
  }

  return (
    <div className='exposure-interface app'>
      <input type='hidden' value={chainId} ref={chainIdRef} />
      {renderAppContent()}
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
