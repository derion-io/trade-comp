function loadJSON(key: string, defaultValue: any): any {
  try {
    const json = localStorage.getItem(key)
    if (json != null) {
      return JSON.parse(json)
    }
  } catch (err) {
    console.error(err)
  }
  return defaultValue
}

export enum SORT_POOL_BY {
  LIQUIDITY,
  INTEREST_RATE,
  DELEVERAGE_RISK
}

export enum VALUE_IN_USD_STATUS {
  AUTO,
  USD,
  TOKEN_R
}

export interface settingsState {
  slippageTolerance: number
  maxInterestRate: number
  minLiquidityShare: number
  maxDeleverageRisk: number
  scanApiKey: { [key: number]: string }
  sortPoolBy: SORT_POOL_BY
  showBalance: boolean
  showValueInUsd: VALUE_IN_USD_STATUS
}

export const initialState: settingsState = {
  sortPoolBy: Number(
    localStorage.getItem('sortPoolBy') ?? SORT_POOL_BY.INTEREST_RATE
  ),
  scanApiKey: loadJSON('scanApiKey', {}),
  slippageTolerance: Number(
    localStorage.getItem('slippageTolerance') ?? 1 / 100
  ),
  maxInterestRate: Number(localStorage.getItem('maxInterestRate') ?? 0.1),
  minLiquidityShare: Number(localStorage.getItem('minLiquidityShare') ?? 1),
  maxDeleverageRisk: Number(localStorage.getItem('maxDeleverageRisk') ?? 100),
  showBalance: Boolean(localStorage.getItem('showBalance') ?? false),
  showValueInUsd: Number(localStorage.getItem('showValueInUsd') ?? 0)
}
