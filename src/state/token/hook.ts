import { utils } from 'ethers'
import {
  addTokensReduce
} from './reducer'
import { useDispatch, useSelector } from 'react-redux'
import { TokenType } from './type'
import { useTokenHelper } from './hooks/useTokenHelper'
import { State } from '../types'

export const useListTokens = () => {
  const { getTokenFromAddresses } = useTokenHelper()
  const { tokens } = useSelector(
    (state: State) => {
      return {
        tokens: state.tokens.tokens
      }
    }
  )
  const dispatch = useDispatch()

  const addTokens = async (
    addresses: string[]
  ): Promise<TokenType[]> => {
    const addressesToFetch = addresses
      .filter((a: string) => utils.isAddress(a) && !tokens[utils.getAddress(a)])
      .map((a: string) => utils.getAddress(a))

    console.log(addressesToFetch)
    const tokenInfo = await getTokenFromAddresses(
      addressesToFetch
    )
    console.log(tokenInfo)
    if (tokenInfo.length > 0) {
      dispatch(addTokensReduce({ tokens: tokenInfo }))
      return tokenInfo
    } else {
      return []
    }
  }

  const getTokens = async (
    addresses: string[]
  ): Promise<TokenType[]> => {
    const addressesToFetch = addresses
      .filter((a: string) => utils.isAddress(a) && !tokens[utils.getAddress(a)])
      .map((a: string) => utils.getAddress(a))

    const tokenInfo = await getTokenFromAddresses(
      addressesToFetch
    )
    if (tokenInfo.length > 0) {
      return tokenInfo
    } else {
      return []
    }
  }

  return {
    tokens,
    getTokens,
    addTokens
  }
}
