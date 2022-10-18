import { createStore, applyMiddleware, combineReducers } from 'redux'
import thunk from 'redux-thunk'
import customWeb3ReactReduce from './customWeb3React/reducer'
import configReduce from './config/reducer'

export const store = createStore(
  combineReducers({
    web3React: customWeb3ReactReduce,
    configs: configReduce
  }),
  applyMiddleware(thunk)
)
