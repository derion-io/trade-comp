import { useSelector } from 'react-redux'
import { State } from '../types'
import configs from './configs'

export const useConfigs = () => {
  const {
    configs,
    engine,
    initialledConfig,
    location,
    useHistory,
    chainId,
    useSubPage,
    language,
    env
  } = useSelector((state: State) => {
    return {
      configs: state.configs.configs,
      engine: state.configs.engine,
      initialledConfig: state.configs.initialledConfig,
      chainId: state.configs.chainId,
      useSubPage: state.configs.useSubPage,
      language: state.configs.language,
      location: state.configs.location,
      useHistory: state.configs.useHistory,
      env: state.configs.env
    }
  })

  return {
    initialledConfig,
    chainId,
    useSubPage,
    language,
    env,
    location,
    useHistory,
    configs, // remove default config
    ddlEngine: engine
  }
}
