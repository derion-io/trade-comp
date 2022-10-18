import { useDispatch, useSelector } from 'react-redux'
import { useEffect } from 'react'
import {
  setAccount, setActive,
  setChainId,
  setProvider,
  setShowWalletModalCallback
} from './reducer'

export const useInitWeb3React = (
  web3ReactData: any,
  showConnectWalletModal: () => void
) => {
  const { library, chainId, account, active } = web3ReactData()

  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(setActive({ active }))
    dispatch(setAccount({ account }))
    dispatch(setChainId({ chainId }))
    dispatch(setProvider({ provider: library }))
    dispatch(setShowWalletModalCallback({ callback: showConnectWalletModal }))
  }, [library, chainId, account])
}

export const useWeb3React = () => {
  const { active, provider, chainId, account, showConnectModal, connectWallet, library } = useSelector(
    (state: any) => {
      return {
        active: state.web3React.active,
        chainId: state.web3React.chainId,
        account: state.web3React.account,
        provider: state.web3React.provider,
        library: state.web3React.provider,
        showConnectModal: state.web3React.showConnectModal,
        connectWallet: state.web3React.showConnectModal
      }
    }
  )

  return { active, provider, chainId, account, connectWallet, showConnectModal, library }
}
