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
import { useDispatch } from 'react-redux'
import { setCurrentPoolInfo } from '../../state/currentPool/reducer'
import { useListPool } from '../../state/pools/hooks/useListPool'
import { Pools } from '../../pages/Pools'
import { SWAP_TAB, TIME_TO_REFRESH_STATE } from '../../utils/constant'
import { Liquidity } from '../../pages/Liquidity'
import { useSwapHistoryFormated } from '../../state/wallet/hooks/useSwapHistory'
import { Trade } from '../../pages/Trade'

export const App = () => {
  const { updateCurrentPool } = useCurrentPool()
  const { tokens } = useListTokens()
  const { pools } = useListPool()
  const { fetchBalanceAndAllowance } = useWalletBalance()
  const { account } = useWeb3React()
  const { configs, chainId, location } = useConfigs()
  const dispatch = useDispatch()
  const chainIdRef = useRef(null)
  const { initListPool } = useListPool()
  useSwapHistoryFormated()

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

  useEffect(() => {
    console.log('configs?.addresses.pool', configs?.addresses.pool)
    if (pools && Object.keys(pools).length > 0) {
      updateCurrentPool(Object.keys(pools)[0])
        .then((data) => {
          // @ts-ignore
          if (Number(chainIdRef?.current?.value) === chainId) {
            dispatch(setCurrentPoolInfo(data))
          }
        })
    }
  }, [chainId, pools])

  const renderAppContent = () => {
    switch (true) {
      case isMatchWithPath('/:tab(exposure|swap)'):
        return <Trade tab={detectTab(location.pathname)} />
      case isMatchWithPath('/pools'):
        return <Pools />
      case isMatchWithPath('/liquidity'):
        return <Liquidity tab={SWAP_TAB.EXPOSURE} />
      default:
        return <Trade tab={SWAP_TAB.EXPOSURE} />
    }
  }

  const detectTab = (path: string) => {
    if (path.includes('swap')) {
      return SWAP_TAB.SWAP
    }
    return SWAP_TAB.EXPOSURE
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
