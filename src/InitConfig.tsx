import React, { Fragment, useEffect } from 'react'
import { useInitWeb3React } from './state/customWeb3React/hook'
import { useInitConfig } from './state/config/useInitConfig'

export const InitConfig = ({
  chainId,
  useWeb3React,
  useSubPage,
  xStorageClient,
  language,
  showConnectWalletModal,
  env,
  children,
  useHistory,
  useLocation
}: any) => {
  useInitWeb3React(useWeb3React, showConnectWalletModal)
  useInitConfig({
    chainId,
    env,
    language,
    useSubPage,
    useHistory,
    useLocation
  })
  return <Fragment>{children}</Fragment>
}
