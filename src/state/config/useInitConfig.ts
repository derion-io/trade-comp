import { useDispatch } from 'react-redux'
import { useEffect } from 'react'
import { setConfigs } from './reducer'
import configs from './configs'
import { useListTokens } from '../token/hook'
import { addTokensReduce } from '../token/reducer'

export const useInitConfig = ({
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

  useEffect(() => {
    // dispatch(resetListTokens())
    // dispatch(resetBnA())
  }, [chainId])

  useEffect(() => {
    console.log('configs[chainId]', configs, chainId, configs[chainId])
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
}
