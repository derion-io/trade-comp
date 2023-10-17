import { useConfigs } from "../state/config/useConfigs"

export const useNativePrice = () => {
  const { configs } = useConfigs()
  return { data: configs.nativePriceUSD ?? 1600 }
}
