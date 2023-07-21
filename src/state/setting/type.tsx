import { CHAINS } from '../../utils/constant'

export enum SORT_POOL_BY {
  LIQUIDITY,
  INTEREST_RATE,
  DELEVERAGE_RISK
}

export interface settingsState {
  slippage: number
  minPayoffRate: number
  maxInterestRate: number
  minLiquidityShare: number
  maxDeleverageRisk: number
  scanApiKey: { [key: number]: string }
  sortPoolBy: SORT_POOL_BY
}

export const initialState: settingsState = {
  sortPoolBy: Number(localStorage.getItem('sortPoolBy') || SORT_POOL_BY.LIQUIDITY),
  scanApiKey: {
    [CHAINS.ARBITRUM]: localStorage.getItem(`scanApiKey-${CHAINS.ARBITRUM}`) || '',
    [CHAINS.GANACHE]: localStorage.getItem(`scanApiKey-${CHAINS.GANACHE}`) || ''
  },
  slippage: Number(localStorage.getItem('slippage') || 3),
  minPayoffRate: Number(localStorage.getItem('minPayoffRate') || 97),
  maxInterestRate: Number(localStorage.getItem('maxInterestRate') || 0.02),
  minLiquidityShare: Number(localStorage.getItem('minLiquidityShare') || 1),
  maxDeleverageRisk: Number(localStorage.getItem('maxDeleverageRisk') || 80)
}
