export interface configsState {
  chainId: number
  theme: 'light' | 'dark'
  useSubPage: any
  language: string
  location: any
  useHistory: any
  env: 'development' | 'production'
}

export const initialState: configsState = {
  chainId: 42161,
  theme: 'dark',
  useSubPage: () => {},
  language: 'en',
  env: 'production',
  location: {},
  useHistory: () => {}
}
