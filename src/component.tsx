import React from 'react'
import { Provider } from 'react-redux'
import { store } from './state'
import { InitConfig } from './InitConfig'
import { App } from './Components/App'

export default ({
  chainId,
  theme,
  useWeb3React,
  useSubPage,
  xStorageClient,
  language,
  useLocation,
  useHistory,
  showConnectWalletModal,
  env
}: {
  chainId: number
  theme: string
  useWeb3React: any
  language?: any
  xStorageClient: any
  useSubPage: any
  useLocation: any
  showConnectWalletModal: () => {}
  env?: 'production' | 'development'
  useHistory?: any
}) => {
  return (
    <Provider store={store}>
      <InitConfig
        useLocation={useLocation}
        useHistory={useHistory}
        chainId={chainId}
        theme={theme}
        useWeb3React={useWeb3React}
        useSubPage={useSubPage}
        xStorageClient={xStorageClient}
        language={language}
        showConnectWalletModal={showConnectWalletModal}
        env={env}
      >
        <App />
      </InitConfig>
    </Provider>
  )
}
