import { useDispatch } from 'react-redux'
import { useEffect } from 'react'
import { setConfigs } from './reducer'
import configs from './configs'

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
    dispatch(
      setConfigs({
        configs: configs[chainId],
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
