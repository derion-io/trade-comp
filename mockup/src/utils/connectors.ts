import { InjectedConnector } from '@web3-react/injected-connector'
import { NetworkConnector } from '@web3-react/network-connector'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'
import { WalletLinkConnector } from '@web3-react/walletlink-connector'
import { AuthereumConnector } from '@web3-react/authereum-connector'
import { TorusConnector } from '@web3-react/torus-connector'

const POLLING_INTERVAL = 12000
const RPC_URLS: { [chainId: number]: string } = {
    1: 'https://mainnet.infura.io/v3/84842078b09946638c03157f83405213' as string,
    4: 'https://mainnet.infura.io/v3/84842078b09946638c03157f83405213' as string
}

const injected = {
    connector: new InjectedConnector({
        supportedChainIds: [1, 3, 4, 5, 42, 56, 97]
    }),
    image: '/images/metamask.svg',
    title: 'Metamask',
    desc: 'Connect to your Metamask Wallet'
}

const network = {
    connector: new NetworkConnector({
        urls: { 1: RPC_URLS[1] },
        defaultChainId: 56
    }),
    image: '/images/walletconnect.svg',
    title: 'WalletConnect',
    desc: 'Scan with WalletConnect to connect'
}

const walletconnect = {
    connector: new WalletConnectConnector({
        rpc: { 1: RPC_URLS[1] },
        qrcode: true,
        pollingInterval: POLLING_INTERVAL
    }),
    image: '/images/walletconnect.svg',
    title: 'WalletConnect',
    desc: 'Scan with WalletConnect to connect'
}

const walletlink = {
    connector: new WalletLinkConnector({
        url: RPC_URLS[1],
        appName: 'web3-react example',
        supportedChainIds: [1, 3, 4, 5, 42, 56, 97]
    }),
    image: '/images/coinbase.svg',
    title: 'Coinbase',
    desc: 'Connect to your Coinbase Wallet'
}

const authereum = {
    connector: new AuthereumConnector({ chainId: 56 }),
    image: '/images/authereum.svg',
    title: 'Authereum',
    desc: 'Connect with your Authereum account'
}

const torus = {
    connector: new TorusConnector({ chainId: 56 }),
    image: '/images/torus.svg',
    title: 'Torus',
    desc: 'Connect with your Torus account'
}

export default {
    injected,
    torus,
    network,
    authereum,
    walletlink,
    walletconnect
}
