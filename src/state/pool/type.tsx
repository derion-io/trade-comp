export interface web3ReactState {
  cToken?: string
  dTokens: string[]
  logicAddress?: string
}

export const initialState: web3ReactState = {
  cToken: undefined,
  dTokens: [],
  logicAddress: undefined
}
