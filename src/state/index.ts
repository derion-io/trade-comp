import { createStore, applyMiddleware, combineReducers } from 'redux'
import thunk from 'redux-thunk'
import customWeb3ReactReduce from './customWeb3React/reducer'
import configReduce from './config/reducer'
import currentPoolReduce from './currentPool/reducer'
import walletReduce from './wallet/reducer'
import tokenReduce from './token/reducer'
import poolsReduce from './resources/reducer'
import settingsReduce from './setting/reducer'

export const store = createStore(
  combineReducers({
    resources: poolsReduce,
    web3React: customWeb3ReactReduce,
    configs: configReduce,
    currentPool: currentPoolReduce,
    wallet: walletReduce,
    tokens: tokenReduce,
    settings: settingsReduce
  }),
  applyMiddleware(thunk)
)
