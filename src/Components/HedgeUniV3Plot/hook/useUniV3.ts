import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json'
import { BigNumber, Contract } from 'ethers'
import { useEffect, useMemo, useState } from 'react'
import { useConfigs } from '../../../state/config/useConfigs'
import INONFUNGIBLE_POSITION_MANAGER from '@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json'
import { useWeb3React } from '../../../state/customWeb3React/hook'
import { load } from 'redux-localstorage-simple'

export const useHedgeUniV3 = () => {
  const { ddlEngine } = useConfigs()
  const { provider } = useWeb3React()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [uni3PosData, setUni3PosData] = useState<{
    uni3PosAddress: string
    uni3PosId: string
    uni3PosData: any
  }>({ uni3PosAddress: '', uni3PosId: '', uni3PosData: null })
  const fetchUni3Poss = async (nfpmContract: Contract, posId: any) => {
    const positionData = await nfpmContract.positions(posId)
    if (!positionData) return null
    return {
      tickLower: positionData.tickLower,
      tickUpper: positionData.tickUpper,
      liquidity: String(positionData.liquidity),
      feeGrowthInside0LastX128: String(positionData.feeGrowthInside0LastX128),
      feeGrowthInside1LastX128: String(positionData.feeGrowthInside1LastX128),
      tokensOwed0: String(positionData.tokensOwed0),
      tokensOwed1: String(positionData.tokensOwed1)
    }
  }
  useEffect(() => {
    const { searchParams } = new URL(
      `https://1.com?${location?.href?.split?.('?')[1]}`
    )
    setLoading(true)
    const uni3Pos = searchParams.get('uni3')
    if (uni3Pos && provider) {
      const [uni3PosAddress, uni3PosId] = uni3Pos?.split?.('-')
      const nfpmContract = new Contract(
        uni3PosAddress,
        INONFUNGIBLE_POSITION_MANAGER.abi,
        provider
      )
      fetchUni3Poss(nfpmContract, uni3PosId)
        .then((res) => {
          setUni3PosData({
            uni3PosId,
            uni3PosAddress,
            uni3PosData: res
          })
          setError('')
          setLoading(false)
        })
        .catch((err) => {
          setLoading(false)
          setError(err?.msg || err.message || err?.reason || err.code)
        })
    } else {
      setError('Uni3 positions path invalid')
      setLoading(false)
    }
  }, [ddlEngine, provider])

  return {
    ...uni3PosData,
    uni3PosLoading: loading,
    uni3PosError: error
  }
}
