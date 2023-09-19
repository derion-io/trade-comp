import { useDispatch } from 'react-redux'
import { useEffect, useMemo } from 'react'
import { setConfigs, setEngine } from './reducer'
import configs from './configs'
import { addTokensReduce } from '../token/reducer'
import { Engine } from 'derivable-tools/dist/engine'
import { DEFAULT_CHAIN, ZERO_ADDRESS } from '../../utils/constant'
import { useSettings } from '../setting/hooks/useSettings'

export const useInitConfig = ({
  library,
  chainId,
  useSubPage,
  language,
  useLocation,
  useHistory,
  env,
  account
}: {
  library: any
  useLocation: any
  useHistory: any
  chainId: number
  useSubPage: any
  language: string
  account: string
  env: 'development' | 'production'
}) => {
  const dispatch = useDispatch()
  const location = useLocation()
  const {
    settings: { scanApiKey }
  } = useSettings()

  const currentScanApiKey = useMemo(() => {
    return scanApiKey[chainId]
  }, [scanApiKey, chainId])

  useEffect(() => {
    dispatch(
      addTokensReduce({
        tokens: [configs[chainId || DEFAULT_CHAIN]?.nativeToken],
        chainId: chainId || DEFAULT_CHAIN
      })
    )
    dispatch(
      setConfigs({
        configs: configs[chainId || DEFAULT_CHAIN],
        chainId: chainId || DEFAULT_CHAIN,
        useSubPage,
        language,
        env,
        location,
        useHistory
      })
    )
  }, [location, useHistory, chainId, useSubPage, language, env])

  useEffect(() => {
    const intConfig = async () => {
      if (!chainId) return
      if (!account) {
        console.log('=======await sync account========')
      }

      console.log('env', env);
      const engine = new Engine(
        {
          env,
          chainId,
          account: account || ZERO_ADDRESS,
          signer: library?.getSigner(),
          scanApiKey: currentScanApiKey || '',
          storage: {
            // @ts-ignore
            setItem: (itemName, value) => localStorage.setItem(itemName, value),
            // @ts-ignore
            getItem: (itemName) => localStorage.getItem(itemName)
          }
        }
      )
      await engine.initServices()
      dispatch(setEngine({ engine }))
    }

    intConfig()
  }, [library, account, chainId, env, currentScanApiKey])
}
