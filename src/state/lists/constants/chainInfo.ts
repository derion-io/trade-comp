import { ChainId } from '@uniswap/sdk-core'

import { ARBITRUM_LIST, AVALANCHE_LIST, BASE_LIST, CELO_LIST, OPTIMISM_LIST, PLASMA_BNB_LIST } from './lists'

// The block number at which v3 was deployed on each chain, separate from the UNIVERSAL_ROUTER_CREATION_BLOCK
export const START_BLOCKS: { [key: number]: number } = {
  [ChainId.MAINNET]: 14292820,
  [ChainId.POLYGON]: 25459720,
  [ChainId.ARBITRUM_ONE]: 175,
  [ChainId.OPTIMISM]: 10028767,
  [ChainId.CELO]: 13916355,
  [ChainId.BNB]: 26324014,
  [ChainId.AVALANCHE]: 31422450,
  [ChainId.BASE]: 1371680
}

export enum NetworkType {
  L1,
  L2,
}
interface BaseChainInfo {
  readonly docs: string
  readonly bridge?: string
  readonly explorer: string
  readonly infoLink: string
  readonly label: string
  readonly helpCenterUrl?: string
  readonly nativeCurrency: {
    name: string // e.g. 'Goerli ETH',
    symbol: string // e.g. 'gorETH',
    decimals: number // e.g. 18,
  }
}

interface L1ChainInfo extends BaseChainInfo {
  readonly networkType: NetworkType.L1
  readonly defaultListUrl?: string
}

export interface L2ChainInfo extends BaseChainInfo {
  readonly networkType: NetworkType.L2
  readonly bridge: string
  readonly statusPage?: string
  readonly defaultListUrl: string
}

export const CHAIN_INFO = {
  [ChainId.MAINNET]: {

  },
  [ChainId.GOERLI]: {

  },
  [ChainId.SEPOLIA]: {

  },
  [ChainId.OPTIMISM]: {
    defaultListUrl: OPTIMISM_LIST

  },
  [ChainId.OPTIMISM_GOERLI]: {
    defaultListUrl: OPTIMISM_LIST

  },
  [ChainId.ARBITRUM_ONE]: {
    defaultListUrl: ARBITRUM_LIST
  },
  [ChainId.ARBITRUM_GOERLI]: {
    defaultListUrl: ARBITRUM_LIST // TODO: use arbitrum goerli token list
  },
  [ChainId.POLYGON]: {

  },
  [ChainId.POLYGON_MUMBAI]: {

  },
  [ChainId.CELO]: {
    defaultListUrl: CELO_LIST
  },
  [ChainId.CELO_ALFAJORES]: {

    defaultListUrl: CELO_LIST
  },
  [ChainId.BNB]: {

    defaultListUrl: PLASMA_BNB_LIST
  },
  [ChainId.AVALANCHE]: {

    defaultListUrl: AVALANCHE_LIST
  },
  [ChainId.BASE]: {
    defaultListUrl: BASE_LIST

  }
} as const

export function getChainInfo(
  chainId: ChainId,
  featureFlags?: Record<ChainId | number, boolean>
): L1ChainInfo
export function getChainInfo(
  chainId: ChainId,
  featureFlags?: Record<ChainId | number, boolean>
): L2ChainInfo
export function getChainInfo(
  chainId: ChainId,
  featureFlags?: Record<ChainId | number, boolean>
): L1ChainInfo | L2ChainInfo
export function getChainInfo(
  chainId: ChainId | number | undefined,
  featureFlags?: Record<ChainId | number, boolean>
): L1ChainInfo | L2ChainInfo | undefined

/**
 * Overloaded method for returning ChainInfo given a chainID
 * Return type varies depending on input type:
 * number | undefined -> returns chaininfo | undefined
 * ChainId -> returns L1ChainInfo | L2ChainInfo
 * SupportedL1ChainId -> returns L1ChainInfo
 * SupportedL2ChainId -> returns L2ChainInfo
 */
export function getChainInfo(
  chainId: any,
  featureFlags?: Record<ChainId | number, boolean>
): any {
  if (featureFlags && chainId in featureFlags) {
    return featureFlags[chainId] ? CHAIN_INFO[chainId] : undefined
  }
  if (chainId) {
    return CHAIN_INFO[chainId] ?? undefined
  }
  return undefined
}

const MAINNET_INFO = CHAIN_INFO[ChainId.MAINNET]
export function getChainInfoOrDefault(chainId: number | undefined, featureFlags?: Record<number, boolean>) {
  return getChainInfo(chainId, featureFlags) ?? MAINNET_INFO
}
