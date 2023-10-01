import { initializeConnector } from '@web3-react/core'
import { MetaMask } from '@web3-react/metamask'
import { WalletConnect as WalletConnectV2 } from '@web3-react/walletconnect-v2'
import { Network } from '@web3-react/network'
import {ARBITRUM_NETWORK, CHAIN_IDS, DEFAULT_CHAIN, RPC_URLS} from "../utils/constant";
import {CoinbaseWallet} from "@web3-react/coinbase-wallet";

export const URLS: { [chainId: number]: string[] } = Object.keys(RPC_URLS).reduce<{ [chainId: number]: string[] }>(
  (accumulator, chainId) => {
    const validURLs: string[] = [RPC_URLS[Number(chainId)]]

    if (validURLs.length) {
      accumulator[Number(chainId)] = validURLs
    }

    return accumulator
  },
  {},
)

function onError(error: Error) {
  console.debug(`web3-react error: ${error}`)
}

export const [web3Injected, web3InjectedHooks] = initializeConnector<MetaMask>((actions) => new MetaMask({ actions }))

export const [web3CoinbaseWallet, web3CoinbaseWalletHooks] = initializeConnector<CoinbaseWallet>(
  (actions) =>
    new CoinbaseWallet({
      actions,
      options: {
        url: RPC_URLS[ARBITRUM_NETWORK],
        appName: 'Derivable',
        appLogoUrl: '',
        reloadOnDisconnect: false,
      },
      onError,
    })
)
export const [walletConnectV2, walletConnectV2Hooks] = initializeConnector<WalletConnectV2>(
  (actions) =>
    new WalletConnectV2({
      actions,
      options: {
        projectId: process.env.REACT_APP_WC_PROJECT_ID as string,
        chains: [DEFAULT_CHAIN],
        optionalChains: CHAIN_IDS,
        showQrModal: true,
        optionalMethods: ['eth_signTypedData', 'eth_signTypedData_v4', 'eth_sign'],
        qrModalOptions: {
          desktopWallets: undefined,
          enableExplorer: true,
          explorerExcludedWalletIds: undefined,
          explorerRecommendedWalletIds: undefined,
          mobileWallets: undefined,
          privacyPolicyUrl: undefined,
          termsOfServiceUrl: undefined,
          themeMode: 'light',
          themeVariables: {
            '--wcm-font-family': '"Inter custom", sans-serif',
            '--wcm-z-index': '999',
          },
          walletImages: undefined,
        },
      },
      onError,
    }),
)

export const [network, networkHooks] = initializeConnector<Network>((actions) => new Network({ actions, urlMap: URLS }))
