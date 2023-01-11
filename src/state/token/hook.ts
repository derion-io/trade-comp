import { useSelector } from 'react-redux'
import { State } from '../types'
import { useConfigs } from '../config/useConfigs'

export const useListTokens = () => {
  const { chainId } = useConfigs()
  const { tokens } = useSelector(
    (state: State) => {
      return {
        tokens: state.tokens.tokens
      }
    }
  )

  return {
    tokens: tokens[chainId]
  }
}
