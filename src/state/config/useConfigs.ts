import { useSelector } from 'react-redux'
import { State } from '../types'

export const useConfigs = () => {
  const {
    routes,
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
      routes: state.configs.routes,
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
    configs,
    routes,
    ddlEngine: engine
  }
}
