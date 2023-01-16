import React, { Fragment } from 'react'
import { useInitWeb3React } from './state/customWeb3React/hook'
import { useInitConfig } from './state/config/useInitConfig'
import { useConfigs } from './state/config/useConfigs'

export const InitConfig = ({
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
  const { initialledConfig } = useConfigs()
  const { chainId, library } = useWeb3React()
  useInitWeb3React(useWeb3React, showConnectWalletModal)
  useInitConfig({
    chainId: chainId || 56,
    library,
    env,
    language,
    useSubPage,
    useHistory,
    useLocation
  })
  if (initialledConfig) {
    return <Fragment>{children}</Fragment>
  }
  return <div>loading</div>
}
