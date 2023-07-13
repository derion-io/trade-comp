export interface settingsState {
  slippage: number
  payoffMinRate: number
  minInterestRate: number
  minLiquidity: number
  deleverageChance: number
}

export const initialState: settingsState = {
  slippage: Number(localStorage.getItem('slippage') || 3),
  payoffMinRate: Number(localStorage.getItem('payoffMinRate') || 97),
  minInterestRate: Number(localStorage.getItem('minInterestRate') || 0.02),
  minLiquidity: Number(localStorage.getItem('minLiquidity') || 1),
  deleverageChance: Number(localStorage.getItem('deleverageChance') || 80)
}
