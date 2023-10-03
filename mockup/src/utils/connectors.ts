import { Web3ReactHooks } from '@web3-react/core'
import { Connector } from '@web3-react/types'
import {
  walletConnectV2,
  walletConnectV2Hooks,
  web3Injected,
  web3InjectedHooks,
  network,
  networkHooks, web3CoinbaseWallet, web3CoinbaseWalletHooks,
} from '../connectors'
import type { MetaMask } from '@web3-react/metamask'
import type { Network } from '@web3-react/network'
import type { WalletConnect as WalletConnectV2 } from '@web3-react/walletconnect-v2'

import { ConnectionType } from './web3React'

export const connectors: [MetaMask | WalletConnectV2 | Network | Connector, Web3ReactHooks][] = [
  [web3Injected, web3InjectedHooks],
  [walletConnectV2, walletConnectV2Hooks],
  [network, networkHooks],
  [web3CoinbaseWallet, web3CoinbaseWalletHooks],
]

export function getConnections() {
  return [web3Injected, walletConnectV2]
}

export const getConnection = (c: Connector | ConnectionType) => {
  if (c instanceof Connector) {
    const connection = getConnections().find((con) => con === c)
    if (!connection) {
      throw Error('unsupported connector')
    }
    return connection
  }
  switch (c) {
    case ConnectionType.INJECTED:
      return web3Injected
    case ConnectionType.WALLET_CONNECT_V2:
      return walletConnectV2
    case ConnectionType.NETWORK:
      return network
    case ConnectionType.COINBASE:
      return web3CoinbaseWallet
    default:
      return null
  }
}
