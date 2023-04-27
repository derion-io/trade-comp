import useSWR from 'swr'
import { useConfigs } from '../state/config/useConfigs'
import { useCurrentPool } from '../state/currentPool/hooks/useCurrentPool'

export const useNativePrice = () => {
  const { ddlEngine } = useConfigs()
  return useSWR({ ddlEngine }, ({ ddlEngine }) => {
    if (ddlEngine) {
      return ddlEngine.PRICE.getNativePrice()
    }
    return undefined
  })
}

// export const useCpPrice = () => {
//   const { ddlEngine } = useConfigs()
//   const { poolAddress, cToken, cTokenPrice, states } = useCurrentPool()
//   return useSWR({
//     params: {
//       poolAddress,
//       cToken,
//       cTokenPrice,
//       states
//     },
//     ddlEngine
//   }, ({ params, ddlEngine }) => {
//     if (ddlEngine) {
//       return ddlEngine.PRICE.fetchCpPrice(params)
//     }
//     return undefined
//   })
// }
