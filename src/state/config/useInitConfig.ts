import { useDispatch } from 'react-redux'
import { useEffect } from 'react'
import { setConfigs } from './reducer'

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
  // const history = useHistory()

  useEffect(() => {
    dispatch(
      setConfigs({
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
