export interface web3ReactState {
  account: string
  chainId: number | null
  active: any
  provider: any
  showConnectModal: () => void
}

export const initialState: web3ReactState = {
  account: '',
  chainId: null,
  active: null,
  provider: null,
  showConnectModal: () => {}
}
