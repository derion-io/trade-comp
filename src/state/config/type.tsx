export interface configsState {
  chainId: number
  useSubPage: any
  language: string
  location: any
  useHistory: any
  env: 'development' | 'production',
  configs: {
    addresses: {[key: string]: string}
    rpcUrl: string
    scanApi: string
    ddlGenesisBlock: number
    explorer: string
    scanName: string
    dTokens: string[]
    powers: number[]
  },
  initialledConfig: boolean
}

export const initialState: configsState = {
  chainId: 0,
  useSubPage: () => {},
  language: 'en',
  env: 'production',
  location: {},
  useHistory: () => {},
  configs: {
    addresses: {},
    rpcUrl: '',
    ddlGenesisBlock: 0,
    scanApi: '',
    explorer: '',
    scanName: '',
    dTokens: [],
    powers: []
  },
  initialledConfig: false
}
