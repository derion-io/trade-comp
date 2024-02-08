import { Engine } from 'derivable-engine/dist/engine'
import { INetworkConfig } from 'derivable-engine/dist/utils/configs'
import { DEFAULT_CHAIN } from '../../utils/constant'

export type Routes = {[key: string]: {type: string, address: string}[]}

export interface configsState {
  chainId: number
  useSubPage: any
  language: string
  location: any
  useHistory: any
  env: 'development' | 'production'
  configs: INetworkConfig
  routes: Routes
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
  routes: {},
  initialledConfig: false
}
