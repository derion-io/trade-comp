import { useDispatch } from 'react-redux'
import { useEffect } from 'react'
import { setConfigs, setEngine } from './reducer'
import configs from './configs'
import { addTokensReduce } from '../token/reducer'
import { Engine } from 'derivable-tools/dist/engine'
import { useWeb3React } from '../customWeb3React/hook'
import { JsonRpcProvider } from '@ethersproject/providers'

export const useInitConfig = (
  {
    chainId,
    useSubPage,
    language,
    useLocation,
    useHistory,
    env
  }: {
    useLocation: any
    useHistory: any
    chainId: number
    useSubPage: any
    language: string
    env: 'development' | 'production'
  }) => {
  const dispatch = useDispatch()
  const location = useLocation()
  const { account } = useWeb3React()

  useEffect(() => {
    dispatch(addTokensReduce({
      tokens: [configs[chainId || 56].nativeToken],
      chainId: chainId || 56
    }))
    dispatch(
      setConfigs({
        configs: configs[chainId || 56],
        chainId: chainId || 56,
        useSubPage,
        language,
        env,
        location,
        useHistory
      })
    )
  }, [location, useHistory, chainId, useSubPage, language, env])

  useEffect(() => {
    if (!chainId) return
    const engine = new Engine({
      account,
      chainId,
      storage: {
        // @ts-ignore
        setItem: (itemName, value) => localStorage.setItem(itemName, value),
        // @ts-ignore
        getItem: (itemName) => localStorage.getItem(itemName)
      },
      scanApi: configs[chainId].scanApi,
      rpcUrl: configs[chainId].rpcUrl,
      provider: new JsonRpcProvider(configs[chainId].rpcUrl),
      providerToGetLog: new JsonRpcProvider(configs[chainId].rpcToGetLogs)
    })
    dispatch(setEngine({ engine }))
  }, [account, chainId])
}
