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
    explorer: string
    scanName: string
  },
  initialledConfig: boolean
}

export const initialState: configsState = {
  chainId: 42161,
  useSubPage: () => {},
  language: 'en',
  env: 'production',
  location: {},
  useHistory: () => {},
  configs: {
    addresses: {},
    rpcUrl: '',
    explorer: '',
    scanName: ''
  },
  initialledConfig: false
}
