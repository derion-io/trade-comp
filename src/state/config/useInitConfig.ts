import { useDispatch } from 'react-redux'
import { useEffect } from 'react'
import { setConfigs, setEngine } from './reducer'
import configs from './configs'
import { addTokensReduce } from '../token/reducer'
import { Engine } from 'derivable-tools/dist/engine'
import { useWeb3React } from '../customWeb3React/hook'
import { JsonRpcProvider } from '@ethersproject/providers'
import { ZERO_ADDRESS } from '../../utils/constant'

export const useInitConfig = (
  {
    library,
    chainId,
    useSubPage,
    language,
    useLocation,
    useHistory,
    env
  }: {
    library: any
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
    console.log(chainId)
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
    console.log(chainId)
    const engine = new Engine({
      account: account || ZERO_ADDRESS,
      chainId,
      storage: {
        // @ts-ignore
        setItem: (itemName, value) => localStorage.setItem(itemName, value),
        // @ts-ignore
        getItem: (itemName) => localStorage.getItem(itemName)
      },
      scanApi: configs[chainId].scanApi,
      rpcUrl: configs[chainId].rpcUrl,
      signer: library?.getSigner(),
      provider: new JsonRpcProvider(configs[chainId].rpcUrl),
      providerToGetLog: new JsonRpcProvider(configs[chainId].rpcToGetLogs)
    })
    dispatch(setEngine({ engine }))
  }, [library, account, chainId])
}
