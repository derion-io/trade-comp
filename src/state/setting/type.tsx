export interface settingsState {
  slippage: number
  payoffMinRate: number
  minInterestRate: number
  minLiquidity: number
  deleverageChance: number
}

export const initialState: settingsState = {
  slippage: 3,
  payoffMinRate: 97,
  minInterestRate: 0.02,
  minLiquidity: 1,
  deleverageChance: 80
}
