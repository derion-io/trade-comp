export interface configsState {
  chainId: number
  useSubPage: any
  language: string
  location: any
  useHistory: any
  env: 'development' | 'production'
}

export const initialState: configsState = {
  chainId: 42161,
  useSubPage: () => {},
  language: 'en',
  env: 'production',
  location: {},
  useHistory: () => {}
}
