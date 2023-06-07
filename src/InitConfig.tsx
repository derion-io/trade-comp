import React, { Fragment } from 'react'
import { useInitWeb3React } from './state/customWeb3React/hook'
import { useInitConfig } from './state/config/useInitConfig'
import { useConfigs } from './state/config/useConfigs'
import { DEFAULT_CHAIN } from './utils/constant'

export const InitConfig = ({
  useWeb3React,
  useSubPage,
  xStorageClient,
  language,
  showConnectWalletModal,
  env,
  children,
  useHistory,
  useLocation,
  chainId: chainIdNotConnect
}: any) => {
  const { initialledConfig } = useConfigs()
  const { chainId, library, account } = useWeb3React()
  useInitWeb3React(useWeb3React, showConnectWalletModal)
  useInitConfig({
    chainId: chainId || DEFAULT_CHAIN,
    library,
    env,
    language,
    useSubPage,
    useHistory,
    useLocation,
    account
  })
  if (initialledConfig) {
    return <Fragment>{children}</Fragment>
  }
  return <div>loading</div>
}
