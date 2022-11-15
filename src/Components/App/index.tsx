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

const { AssistedJsonRpcProvider } = require('assisted-json-rpc-provider')

export const App = () => {
  const { getEventInterface } = useContract()
  const { updateCurrentPool } = useCurrentPool()
  const { tokens } = useListTokens()
  const { fetchBalanceAndAllowance } = useWalletBalance()
  const { account } = useWeb3React()
  const { configs, chainId } = useConfigs()
  const dispatch = useDispatch()
  const chainIdRef = useRef(null)

  useEffect(() => {
    if (account && Object.keys(tokens).length > 0) {
      fetchBalanceAndAllowance(Object.keys(tokens))
    }
  }, [account, tokens])

  useEffect(() => {
    const fetchData = async () => {
      const etherProvider = new ethers.providers.StaticJsonRpcProvider(configs.rpcUrl)
      let provider = etherProvider
      if (configs.scanApi) {
        provider = new AssistedJsonRpcProvider(
          etherProvider,
          {
            url: 'https://api.bscscan1.com/api',
            maxResults: 1000,
            rangeThreshold: 1000,
            rateLimitCount: 1,
            rateLimitDuration: 5000,
            apiKeys: ['']
          }
        )
      }
      const headBlock = await provider.getBlockNumber()

      console.log(ethers.utils.formatBytes32String('DDL'))
      provider.getLogs({
        fromBlock: headBlock,
        toBlock: configs.ddlGenesisBlock,
        topics: [null, null, ethers.utils.formatBytes32String('DDL')]
      }).then((logs: any) => {
        const eventInterface = getEventInterface()
        for (let i = 0; i < logs.length; i++) {
          console.log(eventInterface.parseLog(logs[i]))
        }
      })
    }
    fetchData()
  }, [chainId])

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
    if (configs?.addresses.pool) {
      console.log('configs?.addresses.pool', configs?.addresses.pool)
      updateCurrentPool(configs.addresses.pool)
        .then((data) => {
          // @ts-ignore
          if (Number(chainIdRef.current.value) === chainId) {
            dispatch(addTokensReduce({ tokens: data.tokens }))
            dispatch(setCurrentPoolInfo(data))
          }
        })
    }
  }, [chainId])

  const renderAppContent = () => {
    switch (true) {
      case isMatchWithPath('exposure'):
        return <Exposure />
      case isMatchWithPath('swap'):
        return <Swap />
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
