import { Engine } from 'derivable-tools/dist/engine'
import { INetworkConfig } from 'derivable-tools/dist/utils/configs'
import { DEFAULT_CHAIN } from '../../utils/constant'

export interface configsState {
  chainId: number
  useSubPage: any
  language: string
  location: any
  useHistory: any
  env: 'development' | 'production'
  configs: INetworkConfig
  initialledConfig: boolean
  engine?: Engine
}

export const initialState: configsState = {
  chainId: DEFAULT_CHAIN,
  useSubPage: () => {},
  language: 'en',
  env: 'production',
  location: {},
  useHistory: () => {},
  // @ts-ignore
  configs: {},
  initialledConfig: false
}
