import { useDispatch } from 'react-redux'
import { useEffect } from 'react'
import { setConfigs } from './reducer'

export const useInitConfig = (
  {
    chainId,
    theme,
    useSubPage,
    language,
    useLocation,
    useHistory,
    env
  }: {
    useLocation: any,
    useHistory: any,
    chainId: number,
    theme: 'light' | 'dark',
    useSubPage: any,
    language: string,
    env: 'development' | 'production'
  }
) => {
  const dispatch = useDispatch()
  const location = useLocation()
  // const history = useHistory()

  useEffect(() => {
    dispatch(setConfigs({
      chainId,
      theme,
      useSubPage,
      language,
      env,
      location,
      useHistory
    }))
  }, [location, useHistory, chainId, theme, useSubPage, language, env])
}
