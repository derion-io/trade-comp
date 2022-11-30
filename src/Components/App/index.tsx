import React, { useEffect, useRef } from 'react'
import './style.scss'
import 'react-toastify/dist/ReactToastify.css'
import { matchPath } from 'react-router'
import { Exposure } from '../../pages/Exposure'
import { Swap } from '../../pages/Swap'
import { useListTokens } from '../../state/token/hook'
import { useWalletBalance } from '../../state/wallet/hooks/useBalances'
import { useWeb3React } from '../../state/customWeb3React/hook'
import { ToastContainer } from 'react-toastify'
import { useCurrentPool } from '../../state/currentPool/hooks/useCurrentPool'
import { useConfigs } from '../../state/config/useConfigs'
import { useDispatch } from 'react-redux'
import { addTokensReduce } from '../../state/token/reducer'
import { setCurrentPoolInfo } from '../../state/currentPool/reducer'
import { ethers } from 'ethers'
import { useContract } from '../../hooks/useContract'
import { useListPool } from '../../state/pools/hooks/useListPool'
import { Pools } from '../../pages/Pools'

const { AssistedJsonRpcProvider } = require('assisted-json-rpc-provider')

export const App = () => {
  const { getEventInterface } = useContract()
  const { updateCurrentPool } = useCurrentPool()
  const { tokens } = useListTokens()
  const { pools } = useListPool()
  const { fetchBalanceAndAllowance } = useWalletBalance()
  const { account } = useWeb3React()
  const { configs, chainId } = useConfigs()
  const dispatch = useDispatch()
  const chainIdRef = useRef(null)
  const { initListPool } = useListPool()

  useEffect(() => {
    initListPool()
  }, [chainId])

  useEffect(() => {
    if (account && Object.keys(tokens).length > 0) {
      fetchBalanceAndAllowance(Object.keys(tokens))
    }
  }, [account, tokens])

  // useEffect(() => {
  //   const fetchData = async () => {
  //     const etherProvider = new ethers.providers.StaticJsonRpcProvider(configs.rpcUrl)
  //     let provider = etherProvider
  //     const headBlock = await provider.getBlockNumber()
  //     if (configs.scanApi) {
  //       provider = new AssistedJsonRpcProvider(
  //         etherProvider,
  //         {
  //           url: 'https://api.bscscan1.com/api',
  //           maxResults: 1000,
  //           rangeThreshold: 1000,
  //           rateLimitCount: 1,
  //           rateLimitDuration: 5000,
  //           apiKeys: ['']
  //         }
  //       )
  //       provider.getLogs({
  //         fromBlock: configs.ddlGenesisBlock,
  //         toBlock: headBlock,
  //         topics: [null, null, ethers.utils.formatBytes32String('DDL')]
  //       }).then((logs: any) => {
  //         const eventInterface = getEventInterface()
  //         for (let i = 0; i < logs.length; i++) {
  //           console.log(eventInterface.parseLog(logs[i]))
  //         }
  //       })
  //     } else {
  //       Promise.all(splitRange(configs.ddlGenesisBlock, configs.ddlGenesisBlock + 2000).map((range) => {
  //         console.log({
  //           fromBlock: range.from,
  //           toBlock: range.to,
  //           topics: [null, null, ethers.utils.formatBytes32String('DDL')]
  //         })
  //         return provider.getLogs({
  //           fromBlock: range.from,
  //           toBlock: range.to,
  //           topics: [null, null, ethers.utils.formatBytes32String('DDL')]
  //         })
  //       })).then((data) => {
  //         console.log(data)
  //       })
  //     }
  //   }
  //   fetchData()
  // }, [chainId])
  //
  // const splitRange = (from: number, to: number, range = 3000) => {
  //   const result = []
  //   const length = Math.ceil((to - from) / range)
  //   for (let i = 0; i < length; i++) {
  //     result.push({
  //       from: from,
  //       to: from + range < to ? from + range - 1 : to
  //     })
  //     from = from + range
  //   }
  //   return result
  // }

  // useEffect(() => {
  //   const fetchData = async () => {
  //     const res = await fetch('https://api.bscscan.com/api?module=logs&action=getLogs&fromBlock=22683582&toBlock=5993899932&topic0=0xdfd6ea2aba98c248e9cabe20a983b833e1993ae11d836f1f016e407ba46e06ea')
  //       .then((r) => r.json())
  //     const data = res.result || []
  //     const eventInterface = getEventInterface()
  //     console.log(data)
  //     for (let i = 0; i < data.length; i++) {
  //       console.log(eventInterface.parseLog(data[0]))
  //     }
  //   }
  //   fetchData()
  // }, [])

  useEffect(() => {
    console.log('configs?.addresses.pool', configs?.addresses.pool)
    updateCurrentPool(Object.keys(pools)[0])
      .then((data) => {
        // @ts-ignore
        if (Number(chainIdRef?.current?.value) === chainId) {
          dispatch(setCurrentPoolInfo(data))
        }
      })
  }, [chainId, pools])

  const renderAppContent = () => {
    switch (true) {
      case isMatchWithPath('exposure'):
        return <Exposure />
      case isMatchWithPath('swap'):
        return <Swap />
      case isMatchWithPath('pools'):
        return <Pools />
      default:
        return <Exposure />
    }
  }

  const isMatchWithPath = (path: string) => {
    return !!matchPath({
      path,
      // @ts-ignore
      exact: true,
      // @ts-ignore
      strict: false
    }, location.pathname)
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
