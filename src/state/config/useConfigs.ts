import { useSelector } from 'react-redux'
import { State } from '../types'

export const useConfigs = () => {
  const { configs, location, useHistory, chainId, useSubPage, language, env } = useSelector(
    (state: State) => {
      return {
        chainId: state.configs.chainId,
        useSubPage: state.configs.useSubPage,
        language: state.configs.language,
        location: state.configs.location,
        useHistory: state.configs.useHistory,
        env: state.configs.env,
        configs: state.configs.configs
      }
    }
  )

  return { chainId, useSubPage, language, env, location, useHistory, configs }
}
