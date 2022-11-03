import React, { useEffect } from 'react'
import './style.scss'
import 'react-toastify/dist/ReactToastify.css'
import { matchPath } from 'react-router'
import { Exposure } from '../../pages/Exposure'
import { Swap } from '../../pages/Swap'
// import { useContract } from '../../hooks/useContract'
// import { useConfigs } from '../../state/config/useConfigs'
import { useListTokens } from '../../state/token/hook'
import { useWalletBalance } from '../../state/wallet/hooks/useBalances'
import { useWeb3React } from '../../state/customWeb3React/hook'
import { ToastContainer } from 'react-toastify'

export const App = () => {
  // const { getLogicContract } = useContract()
  // const { configs } = useConfigs()
  const { tokens } = useListTokens()
  const { fetchBalanceAndAllowance } = useWalletBalance()
  const { account } = useWeb3React()

  useEffect(() => {
    if (account) {
      fetchBalanceAndAllowance(Object.keys(tokens))
    }
  }, [account, tokens])

  // useEffect(() => {
  //   const fetchData = async () => {
  //     const res = await fetch('https://api.bscscan.com/api?module=logs&action=getLogs&fromBlock=0&toBlock=5993899932&topic0=0xdfd6ea2aba98c248e9cabe20a983b833e1993ae11d836f1f016e407ba46e06ea')
  //       .then((r) => r.json())
  //     const data = res.result || []
  //     const logicContract = getLogicContract(configs.addresses.logic)
  //     for (let i = 0; i < data.length; i++) {
  //       console.log(logicContract.interface.parseLog(data[0]))
  //     }
  //   }
  //   fetchData()
  // }, [])

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
