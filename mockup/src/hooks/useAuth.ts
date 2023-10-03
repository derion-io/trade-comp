import {useCallback} from 'react'
import {useWeb3React} from '@web3-react/core'
import {ConnectionType} from '../utils/web3React'
import {getConnection} from '../utils/connectors'
import {WALLET_CONNECTOR} from "../utils/constant";

const useAuth = () => {
  const {chainId, connector, account} = useWeb3React()

  const login = useCallback(async (connectorType: ConnectionType) => {
    const connector2 = getConnection(connectorType)
    try {
      if (connector2?.connectEagerly && connectorType) {
        await connector2.connectEagerly()
        if (!account) {
          await connector2.activate()
        }
      } else {
        await connector2?.activate()
      }
    } catch (error) {
      const res = await connector2?.activate()
      console.log('🚀 ~ file: useAuth.ts:24 ~ login ~ rest:', res)
    }
    localStorage.setItem(WALLET_CONNECTOR, connectorType)
  }, [])

  const logout = useCallback(async () => {
    try {
      const connectorType = localStorage.getItem(WALLET_CONNECTOR)
      if (connectorType) {
        // @ts-ignore
        const connector2 = getConnection(connectorType)
        if (connector2 && connector2?.deactivate) {
          connector2.deactivate()
        }
        connector2?.resetState?.()
        connector?.deactivate?.()
        connector?.resetState?.()
        localStorage.removeItem(WALLET_CONNECTOR)
      }
    } catch (e) {
      console.log('🚀 ~ file: useAuth.ts:38 ~ logout ~ e:', e)
    }
  }, [chainId])

  return {login, logout}
}

export default useAuth
