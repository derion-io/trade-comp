import { PoolType } from '../state/resources/type'
import { useEffect, useState } from 'react'
import { useListTokens } from '../state/token/hook'
import { useConfigs } from '../state/config/useConfigs'
import { isAddress } from 'ethers/lib/utils'
import _ from 'lodash'

export const useListTokenHasUniPool = (pool: PoolType) => {
  const [data, setData] = useState<string[]>([])
  const { tokens } = useListTokens()
  const { ddlEngine } = useConfigs()

  useEffect(() => {
    const fetcher = async () => {
      const allErcToken = _.uniq(Object.keys(tokens).filter((e) => isAddress(e)))

      // eslint-disable-next-line no-unused-expressions
      const uniPools = await ddlEngine?.UNIV3PAIR?.getPairAddress({
        baseToken: pool.TOKEN_R,
        quoteTokens: allErcToken
      })
      const results = uniPools ? allErcToken.filter((address) => {
        // check erc20 token have uniPool
        return Object.keys(uniPools).map((key) => key.split('-')[1]).includes(address)
      }) : []
      setData(results)
    }

    if (pool?.TOKEN_R) {
      fetcher()
    }
  }, [JSON.stringify(tokens), pool?.TOKEN_R])

  return { data }
}
