import React, { Suspense, useEffect, useState } from 'react'
import { useWeb3React } from '@web3-react/core'
import './style.scss'
import '../../styles/main.scss'
import { WalletLogoIcon } from '../Icons'
import 'web3-react-modal/dist/index.css'
import { Web3ReactModal } from 'web3-react-modal'
import { UserWalletModal } from '../UserWalletModal'
import { shortenAddressString, weiToNumber } from '../../utils/helpers'
import { Menu } from '../Menu'
import { useHistory, useLocation } from 'react-router-dom'
import { ethers } from 'ethers'
import { BlurBackground } from '../BlurBackground'
import useAuth from '../../hooks/useAuth'
import { WALLET_CONNECTOR } from '../../utils/constant'
import { ConnectionType } from '../../utils/web3React'

export const AppLayout = (props: any) => {
  const { account, isActive, chainId, provider } = useWeb3React()
  const { logout, login } = useAuth()
  const [balance, setBalance] = useState<any>()
  const [visibleWalletModal, setVisibleWalletModal] = useState<any>()
  const [visibleUserWalletModal, setVisibleUserWalletModal] = useState<any>()
  const location = useLocation()
  const { configs, Component } = props
  const [chainIdToDisPlay, setChainIdToDisPlay] = useState<number>(8453);

  useEffect(() => {
    const initConnector = localStorage.getItem(WALLET_CONNECTOR)
    if (initConnector && !isActive) {
      //@ts-ignore
      login(initConnector)
    }
  }, [isActive])

  // useEffect(() => {
  //   const initConnector = localStorage.getItem(LS_CONNECTOR)
  //   if (initConnector) {
  //     const connector: any = Object.values(connectors)
  //       .map(({ connector }) => connector)
  //       .find(connector => connector?.constructor?.name === initConnector)
  //     const handleAccountsChanged = (accounts: any) => {
  //       if (accounts.length > 0) {
  //         activate(connector)
  //       }
  //     }
  //     const { ethereum } = window
  //     if(ethereum && ethereum.on && connector && !active && !error) {
  //       ethereum.on("accountsChanged", handleAccountsChanged)
  //       return () => {
  //         if (ethereum.removeListener) {
  //           ethereum.removeListener("accountsChanged", handleAccountsChanged);
  //         }
  //       }
  //     }
  //   }
  //   return
  // }, [activate, active, error])

  useEffect(() => {
    if(chainId) {
      setChainIdToDisPlay(chainId)
    }
  }, [chainId])

  useEffect(() => {
    if (!!account && !!provider) {
      provider
        .getBalance(account)
        .then((balance: any) => {
          setBalance(weiToNumber(balance))
        })
        .catch(() => {
          setBalance(null)
        })
      setBalance(undefined)
    }
  }, [account, provider, chainId])

  return <div className={`body dark`}>
    <aside className='sidebar'>
      <Menu menuConfig={[configs]} />
      <div className='select-chain-box'>
        <span className='text-white'>Chain</span>
        <select name="" id="select-chain" value={chainIdToDisPlay} onChange={(e) => {
          setChainIdToDisPlay(Number(e.target.value))
        }}>
          <option value="8453">Base</option>
          <option value="42161">Arbitrum</option>
          <option value="56">Bsc</option>
        </select>
      </div>
      <div className='connect-wallet '>
        {
          isActive ? (
            <span
              className='short-address-box'
              onClick={() => setVisibleUserWalletModal(true)}
            >
                                <span>
                                    {shortenAddressString(account ? account : '')}
                                </span>
                                <WalletLogoIcon />
                            </span>
          ) : (
            <span
              className='short-address-box'
              onClick={() => setVisibleWalletModal(true)}
            >
                            Login
                        </span>
          )
        }
      </div>
    </aside>
    <BlurBackground pointNumber={20}>
      <section className='layout'>
        <Suspense fallback={null}>
          <Component
            chainId={Number(chainIdToDisPlay)}
            useHistory={useHistory}
            useLocation={useLocation}
            useWeb3React={useWeb3React}
            ethers={ethers}
            language="en"
            useSubPage={() => location.pathname}
            env={process.env.REACT_APP_NODE_ENV || "development"}
            showConnectWalletModal={() => setVisibleWalletModal(true)}
          />
        </Suspense>
      </section>
    </BlurBackground>
    <Web3ReactModal
      visible={visibleWalletModal}
      setVisible={setVisibleWalletModal}
      providerOptions={Object.values(ConnectionType)}
      onConnect={(connector: any) => {
        login(connector)
      }}
    />
    <UserWalletModal
      visible={visibleUserWalletModal}
      setVisible={setVisibleUserWalletModal}
      deactivate={() => {
        logout()
      }}
      balance={balance ? balance : ''}
      account={account ? account : ''}
    />
  </div>
}
