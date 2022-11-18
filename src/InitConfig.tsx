import React, { Fragment } from 'react'
import { useInitWeb3React } from './state/customWeb3React/hook'
import { useInitConfig } from './state/config/useInitConfig'
import { useConfigs } from './state/config/useConfigs'
import { useListPool } from './state/pools/hooks/useListPool'

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
  const { chainId } = useWeb3React()
  useInitWeb3React(useWeb3React, showConnectWalletModal)
  useInitConfig({
    chainId,
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
