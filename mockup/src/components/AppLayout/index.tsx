import React, { Suspense, useEffect, useState } from 'react'
import { useWeb3React } from '@web3-react/core'
import './style.scss'
import '../../styles/main.scss'
import { WalletLogoIcon } from '../Icons'
import 'web3-react-modal/dist/index.css'
import { Web3ReactModal } from 'web3-react-modal'
import connectors from '../../utils/connectors'
import { UserWalletModal } from '../UserWalletModal'
import { shortenAddressString, weiToNumber } from '../../utils/helpers'
import { Menu } from '../Menu'
import { useHistory, useLocation } from 'react-router-dom'
import { ethers } from 'ethers'
import { BlurBackground } from '../BlurBackground'

const LS_CONNECTOR = 'web3connector'

export const AppLayout = (props: any) => {
  const { activate, active, account, deactivate, chainId, library } = useWeb3React()
  const [balance, setBalance] = useState<any>()
  const [visibleWalletModal, setVisibleWalletModal] = useState<any>()
  const [visibleUserWalletModal, setVisibleUserWalletModal] = useState<any>()
  const location = useLocation()
  const { configs, Component } = props
  const [chainIdToDisPlay, setChainIdToDisPlay] = useState<number>(42161);

  useEffect(() => {
    const initConnector = localStorage.getItem(LS_CONNECTOR)
    if (initConnector) {
      const connector = Object.values(connectors)
        .map(({ connector }) => connector)
        .find(connector => connector?.constructor?.name === initConnector)
      if (connector) {
        activate(connector)
      }
    }
  }, [activate])


  useEffect(() => {
    if (!!account && !!library) {
      library
        .getBalance(account)
        .then((balance: any) => {
          setBalance(weiToNumber(balance))
        })
        .catch(() => {
          setBalance(null)
        })
      setBalance(undefined)
    }
  }, [account, library, chainId])

  return <div className={`body dark'}`}>
    <aside className='sidebar'>
      <Menu menuConfig={[configs]} />
      <div className='select-chain-box'>
        <span className='text-white'>Chain</span>
        <select name="" id="select-chain" value={chainIdToDisPlay} onChange={(e) => {
          setChainIdToDisPlay(Number(e.target.value))
        }}>
          <option value="56">BSC</option>
          <option value="42161">Arbitrum</option>
        </select>
      </div>
      <div className='connect-wallet '>
        {
          active ? (
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
            env={process.env.REACT_APP_NODE_ENV || "production"}
            showConnectWalletModal={() => setVisibleWalletModal(true)}
          />
        </Suspense>
      </section>
    </BlurBackground>
    <Web3ReactModal
      visible={visibleWalletModal}
      setVisible={setVisibleWalletModal}
      providerOptions={connectors}
      onConnect={(connector: any) => {
        activate(connector)
        const name = connector?.constructor?.name
        if (name) {
          localStorage.setItem(LS_CONNECTOR, name)
        }
      }}
    />
    <UserWalletModal
      visible={visibleUserWalletModal}
      setVisible={setVisibleUserWalletModal}
      deactivate={() => {
        deactivate()
        localStorage.removeItem(LS_CONNECTOR)
      }}
      balance={balance ? balance : ''}
      account={account ? account : ''}
    />
  </div>
}
