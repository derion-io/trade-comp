import {IUniPoolV3, IUniPosV3} from 'derivable-engine/dist/services/balanceAndAllowance'
import {useEffect,useMemo,useState} from 'react'
import {useDispatch,useSelector} from 'react-redux'
import {useConfigs} from '../../config/useConfigs'
import {useWeb3React} from '../../customWeb3React/hook'
import {useResource} from '../../resources/hooks/useResource'
import {useListTokens} from '../../token/hook'
import {State} from '../../types'
import {setAllUni3Pos,setCurrentUni3Pos,setUni3Pos} from '../reducer'
import {useTokenPrice} from '../../resources/hooks/useTokenPrice'
import {calculatePx} from '../../../utils/helpers'
import {TokenType} from 'derivable-engine/dist/types'
import {useTokenValue} from '../../../Components/SwapBox/hooks/useTokenValue'
export interface IDisplayUniPosV3 {
  tickLower: number,
  pxLower: number,
  pxLowerPerc: number,
  tickUpper: number,
  pxUpper: number,
  pxUpperPerc: number,
  px: number,
  liquidity: string,
  posLiquidityToken0: number,
  posLiquidityToken1: number,
  totalPositionByToken1: number,
  totalPositionByUSD: number,
  feeGrowthInside0LastX128: string,
  feeGrowthInside1LastX128: string,
  fee: string,
  tokensOwed0: string,
  tokensOwed1: string,
  token0: string,
  token1: string,
  token0Data:TokenType,
  token1Data: TokenType,
  poolAddress: string,
  poolState?: IUniPoolV3,
}
export const useUni3Position = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const prices = useTokenPrice()
  const { configs, ddlEngine } = useConfigs()
  const { provider, chainId,account } = useWeb3React()
  const { tokens } = useListTokens()
  const { getTokenValue } = useTokenValue({})

  const { currentUni3Position, uni3Positions } = useSelector((state: State) => {
    return {
      currentUni3Position: state.uni3Positions.currentUni3Position,
      uni3Positions: state.uni3Positions.uni3Positions,
    }
  })
  const dispatch = useDispatch()

  const setCurrentUni3Position = (address: string) => {
    dispatch(setCurrentUni3Pos({ uni3Pos: address }))
  }

  const setAllUni3Positions = (uni3Positions: {[key: string]: IUniPosV3}) => {
    dispatch(setAllUni3Pos({ uni3Positions: uni3Positions}))
  }
  const setUni3Position = (uni3Position: IUniPosV3, key:string) => {
    dispatch(setUni3Pos({ key ,uni3Pos: uni3Position}))
  }
  
  const displayUni3Positions = useMemo(() => {
    const displayUni3Poss: {[key:string]: IDisplayUniPosV3} = {}
    Object.keys(uni3Positions).map(uni3PosKey => {
      if(!uni3PosKey || !uni3Positions?.[uni3PosKey]) return;
      const { tickLower, tickUpper,token0, token1, token0Data, token1Data, poolState, liquidity, fee, feeGrowthInside1LastX128, feeGrowthInside0LastX128 } = uni3Positions?.[uni3PosKey]
      const {slot0, poolLiquidity} = poolState as IUniPoolV3
      const tokenA = token0Data || tokens[token0]
      const tokenB = token1Data || tokens[token1]
      if(!tokenA || !tokenB|| !slot0) return;

      const diffDecimals = tokenA?.decimals === tokenB?.decimals ? 1 : 10 ** Math.abs(tokenA?.decimals - tokenB?.decimals)
      const pxLower = calculatePx(tickLower)
      const pxUpper = calculatePx(tickUpper)
      const px = calculatePx(slot0.tick)
      const pxUpperPerc = pxUpper / px 
      const pxLowerPerc = pxLower / px
      const sqrtPx = Math.sqrt(px);
      const sqrtPxLower = Math.sqrt(pxLower);
      const sqrtPxUpper = Math.sqrt(pxUpper);
  
      const posLiquidityToken0 =
        (Number(liquidity) * (sqrtPxUpper - sqrtPx) / (sqrtPx * sqrtPxUpper)) / 10 ** tokenA.decimals;
      const posLiquidityToken1 = Number(liquidity) * (sqrtPx - sqrtPxLower) / 10 ** tokenB?.decimals;
      const totalPositionByToken1 = posLiquidityToken1 + posLiquidityToken0 * px
      const totalPositionByUSD = Number(getTokenValue(token1, String(totalPositionByToken1), true))

      displayUni3Poss[uni3PosKey] = {
        pxLower: pxLower * diffDecimals,
        pxUpper: pxUpper * diffDecimals,
        px: px * diffDecimals,
        pxLowerPerc,
        pxUpperPerc,
        posLiquidityToken0,
        posLiquidityToken1,
        totalPositionByToken1,
        totalPositionByUSD,
        ...uni3Positions[uni3PosKey]
      }
    })
    return displayUni3Poss
  },[uni3Positions])
  return {
    loading,
    useFetchUni3Position,
    displayUni3Positions,
    error,
    uni3Positions,
    currentUni3Position: currentUni3Position ? uni3Positions?.[currentUni3Position] : undefined,
    currentDisplayUni3Position: currentUni3Position ? displayUni3Positions?.[currentUni3Position] : undefined,
    setCurrentUni3Position,
    setUni3Position,
    setAllUni3Positions,
  }
}

export const useFetchUni3Position = () => {
  const { configs, ddlEngine } = useConfigs()
  const { provider, chainId,account } = useWeb3React()
  const {tokens} = useListTokens()
  const dispatch = useDispatch()
  const { currentUni3Position } = useSelector((state: State) => {
    return {
      currentUni3Position: state.uni3Positions.currentUni3Position,
    }
  })
  const fetchUni3Pos = async (): Promise<{[key: string]: IUniPosV3}>  => {
    let accountUni3Pos:{[key: string]: IUniPosV3} = {}
    if(ddlEngine && account){
      // const cacheLogs = ddlEngine.RESOURCE.getCachedLogs(account)
      const accountAssets = ddlEngine.RESOURCE.updateAssets({account, logs: ddlEngine.RESOURCE.allLogs})
      try {
        accountUni3Pos = await ddlEngine.BNA.loadUniswapV3Position({assetsOverride: accountAssets})
      } catch (error) {
        console.log(error)
      }
      dispatch(setAllUni3Pos({ uni3Positions: accountUni3Pos}))
      if(!currentUni3Position) {
        dispatch(setCurrentUni3Pos({ uni3Pos: Object.keys(accountUni3Pos)[0]}))
      }
    }
    return accountUni3Pos
  }
 
  useEffect(() => {
    if(Object.keys(tokens).length > 0) fetchUni3Pos()
  }, [ddlEngine, chainId, tokens, configs.name])

}