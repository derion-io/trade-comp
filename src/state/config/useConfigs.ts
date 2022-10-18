import { useSelector } from 'react-redux'
import { State } from '../types'

export const useConfigs = () => {
  const { location, useHistory, chainId, theme, useSubPage, language, env } = useSelector(
    (state: State) => {
      return {
        chainId: state.configs.chainId,
        theme: state.configs.theme,
        useSubPage: state.configs.useSubPage,
        language: state.configs.language,
        location: state.configs.location,
        useHistory: state.configs.useHistory,
        env: state.configs.env
      }
    }
  )

  return { chainId, theme, useSubPage, language, env, location, useHistory }
}
