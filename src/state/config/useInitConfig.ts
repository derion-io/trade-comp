import { useDispatch } from 'react-redux'
import { useEffect, useMemo } from 'react'
import { seNetworkConfigs, setConfigs } from './reducer'
import { addTokensReduce } from '../token/reducer'
import { Engine } from 'derivable-tools/dist/engine'
import {
  DEFAULT_CHAIN,
  NATIVE_ADDRESS,
  ZERO_ADDRESS
} from '../../utils/constant'
import { useSettings } from '../setting/hooks/useSettings'

export const useInitConfig = ({
  provider,
  chainId,
  useSubPage,
  language,
  useLocation,
  useHistory,
  env,
  account
}: {
  provider: any
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
      setConfigs({
        // chainId,
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

      const engine = new Engine({
        env,
        chainId,
        account: account || ZERO_ADDRESS,
        signer: provider?.getSigner(),
        scanApiKey: currentScanApiKey || '',
        storage: {
          // @ts-ignore
          setItem: (itemName, value) => localStorage.setItem(itemName, value),
          // @ts-ignore
          getItem: (itemName) => localStorage.getItem(itemName)
        }
      })
      await engine.initServices()
      dispatch(
        addTokensReduce({
          tokens: [
            {
              name: engine.profile.configs.nativeSymbol,
              symbol: engine.profile.configs.nativeSymbol,
              decimal: 18,
              address: NATIVE_ADDRESS
            }
          ],
          chainId: chainId || DEFAULT_CHAIN
        })
      )
      dispatch(
        seNetworkConfigs({
          chainId,
          engine,
          configs: engine.profile.configs,
          routes: engine.profile.routes
        })
      )
      // dispatch(setEngine({ engine }))
    }

    intConfig()
  }, [provider, account, chainId, env, currentScanApiKey])
}
