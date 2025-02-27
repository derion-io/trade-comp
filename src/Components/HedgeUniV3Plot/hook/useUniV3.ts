import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json'
import ERC20Abi from '../../../assets/abi/IERC20.json'
import { BigNumber, Contract } from 'ethers'
import { useEffect, useMemo, useState } from 'react'
import { useConfigs } from '../../../state/config/useConfigs'
import INONFUNGIBLE_POSITION_MANAGER from '@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json'
import { useWeb3React } from '../../../state/customWeb3React/hook'
import { load } from 'redux-localstorage-simple'
import { computePoolAddress, FeeAmount, Pool } from '@uniswap/v3-sdk'
import { Token } from '@uniswap/sdk-core'
interface IUniPosV3 {
    tickLower: number,
    tickUpper: number,
    liquidity: string,
    feeGrowthInside0LastX128: string,
    feeGrowthInside1LastX128: string,
    fee: string,
    tokensOwed0: string,
    tokensOwed1: string,
    token0: string,
    token1: string
}
export const useHedgeUniV3 = () => {
  const { configs } = useConfigs()
  const { provider, chainId } = useWeb3React()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [uni3PosState, setUni3PosState] = useState<{
    uni3PosAddress: string
    uni3PosId: string
    uni3PosData?: IUniPosV3
  }>({ uni3PosAddress: '', uni3PosId: '' })
  const [uni3PoolState, setUni3PoolState] = useState<{
    token0Data?: Token,
    token1Data?: Token,
    poolLiquidity?: string,
    slot0?: any,
    tick?: number,
    sqrtPriceX96?: string,
  }>({})
  const fetchUni3Pos = async (nfpmContract: Contract, posId: any): Promise<IUniPosV3 | undefined> => {
    const positionData = await nfpmContract.positions(posId)
    if (!positionData) return;
    return {
      tickLower: positionData.tickLower,
      tickUpper: positionData.tickUpper,
      liquidity: String(positionData.liquidity),
      feeGrowthInside0LastX128: String(positionData.feeGrowthInside0LastX128),
      feeGrowthInside1LastX128: String(positionData.feeGrowthInside1LastX128),
      fee: String(positionData.fee),
      tokensOwed0: String(positionData.tokensOwed0),
      tokensOwed1: String(positionData.tokensOwed1),
      token0: String(positionData.token0),
      token1: String(positionData.token1)
    }
  }
  const fetchTokenData = async (token: string): Promise<Token> => {
    const tokenContract = new Contract(token, ERC20Abi, provider)
    const [symbol, decimals] = await Promise.all([
      await tokenContract.symbol(),
      await tokenContract.decimals()
    ])
    return new Token(chainId, token, decimals, symbol, symbol)
  }
  const fetchUni3Pool = async (token0: string, token1: string, fee: string) => {
    const tokenA = await fetchTokenData(token0)
    const tokenB = await fetchTokenData(token1)
    const factoryAddress = Object.keys(configs.factory).filter(
      (facAddress) => configs.factory[facAddress].type === 'uniswap3'
    )?.[0]
    if (!tokenA || !tokenB || !factoryAddress) {
      throw 'Invalid token or factory data'
    }
    const poolAddress = computePoolAddress({
      factoryAddress: factoryAddress,
      tokenA,
      tokenB,
      fee: Number(fee) as FeeAmount
    })
    const poolContract = new Contract(
      poolAddress,
      IUniswapV3PoolABI.abi,
      provider
    )
    const [liquidity, slot0] = await Promise.all([
      poolContract.liquidity(),
      poolContract.slot0()
    ])
    return {
        token0Data: tokenA,
        token1Data: tokenB,
        poolLiquidity: liquidity,
        tick: Number(slot0?.tick),
        sqrtPriceX96: String(slot0?.sqrtPriceX96),
        slot0,
    }
  }
  useEffect(() => {
    const { searchParams } = new URL(
      `https://1.com?${location?.href?.split?.('?')[1]}`
    )
    setLoading(true)
    const uni3Pos =
      searchParams.get('uni3') ||
      '0xc36442b4a4522e871399cd717abdd847ab11fe88-3789515'
    if (uni3Pos && provider) {
      const [uni3PosAddress, uni3PosId] = uni3Pos?.split?.('-')
      const nfpmContract = new Contract(
        uni3PosAddress,
        INONFUNGIBLE_POSITION_MANAGER.abi,
        provider
      )

      fetchUni3Pos(nfpmContract, uni3PosId)
        .then((res) => {
          setUni3PosState({
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
  }, [provider])
  useEffect(() => {
    if(uni3PosState?.uni3PosData){
        const {token0, token1, fee} = uni3PosState?.uni3PosData
        fetchUni3Pool(token0, token1, fee).then(res => {
            setUni3PoolState(res)
        }).catch((err) => {
            console.log(err)
            setError(err?.msg || err.message || err?.reason || err.code)
        })
    }
  },[uni3PosState])
  return {
    ...uni3PosState,
    ...uni3PoolState,
    uni3PosLoading: loading,
    uni3PosError: error
  }
}
