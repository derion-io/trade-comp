import React from 'react'
import { Provider } from 'react-redux'
import { store } from './state'
import { InitConfig } from './InitConfig'
import { App } from './Components/App'
import './styles/main.scss'
import 'leverage-slider/dist/component.css'
import { SWRConfig } from 'swr/_internal'
import { ConfigProvider, theme as antdTheme } from 'antd'

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
  const { darkAlgorithm } = antdTheme

  return (
    <Provider store={store}>
      <SWRConfig
        value={{
          dedupingInterval: 200, // will override the parent value since the value is primitive
          fallback: { a: 2, c: 2 } // will merge with the parent value since the value is a mergeable object
        }}
      >
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
          <ConfigProvider theme={{
            algorithm: darkAlgorithm,
            token: {
              colorBgBase: '#242731',
              colorTextBase: '#fff',
              colorPrimaryBg: '#292b33'
            }
          }}
          >
            <App />
          </ConfigProvider>
        </InitConfig>
      </SWRConfig>
    </Provider>
  )
}
