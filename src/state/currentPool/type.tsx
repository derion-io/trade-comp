export interface currentPoolState {
  cToken?: string
  dTokens: string[]
  logicAddress?: string
  states: any
  powers: number[]
}

export const initialState: currentPoolState = {
  cToken: undefined,
  dTokens: [],
  logicAddress: undefined,
  states: {},
  powers: []
}
