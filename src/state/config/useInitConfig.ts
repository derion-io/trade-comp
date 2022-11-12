import { useDispatch } from 'react-redux'
import { useEffect } from 'react'
import { setConfigs } from './reducer'
import configs from './configs'
import { resetListTokens } from '../token/reducer'
import { resetBnA } from '../wallet/reducer'

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
    dispatch(resetListTokens())
    dispatch(resetBnA())
  }, [chainId])

  useEffect(() => {
    console.log('configs[chainId]', configs, chainId, configs[chainId])
    dispatch(
      setConfigs({
        configs: configs[chainId || 56],
        chainId,
        useSubPage,
        language,
        env,
        location,
        useHistory
      })
    )
  }, [location, useHistory, chainId, useSubPage, language, env])
}
