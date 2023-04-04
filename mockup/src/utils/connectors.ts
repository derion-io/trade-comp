import { InjectedConnector } from '@web3-react/injected-connector'
import { NetworkConnector } from '@web3-react/network-connector'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'
import { WalletLinkConnector } from '@web3-react/walletlink-connector'
import { AuthereumConnector } from '@web3-react/authereum-connector'

const RPC_URLS: { [chainId: number]: string } = {
    1: 'https://mainnet.infura.io/v3/84842078b09946638c03157f83405213' as string,
    4: 'https://mainnet.infura.io/v3/84842078b09946638c03157f83405213' as string
}

const injected = {
    connector: new InjectedConnector({
        supportedChainIds: [ 56, 1337, 31337, 97, 42161]
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
        rpc: RPC_URLS,
        qrcode: true,
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


export default {
    injected,
    network,
    authereum,
    walletlink,
    walletconnect
}
