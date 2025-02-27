import {IUniPoolV3,IUniPosV3} from 'derivable-engine/dist/services/balanceAndAllowance'
import {PoolType, TokenType} from 'derivable-engine/dist/types'
import {useCallback, useEffect,useMemo,useState} from 'react'
import {useDispatch,useSelector} from 'react-redux'
import {useTokenValue} from '../../../Components/SwapBox/hooks/useTokenValue'
import {calculatePx, unwrap} from '../../../utils/helpers'
import {useConfigs} from '../../config/useConfigs'
import {useCurrentPoolGroup} from '../../currentPool/hooks/useCurrentPoolGroup'
import {useWeb3React} from '../../customWeb3React/hook'
import {useResource} from '../../resources/hooks/useResource'
import {useListTokens} from '../../token/hook'
import {State} from '../../types'
import {setAllUni3Pos,setCurrentUni3Pos,setUni3Loading,setUni3Pos} from '../reducer'
import {useHelper} from '../../config/useHelper'
import {uniq} from 'lodash'
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
  const { tokens } = useListTokens()
  const { getTokenValue } = useTokenValue({})
  const { currentUni3Position, uni3Positions, uni3Loading } = useSelector((state: State) => {
    return {
      currentUni3Position: state.uni3Positions.currentUni3Position,
      uni3Positions: state.uni3Positions.uni3Positions,
      uni3Loading: state.uni3Positions.uni3Loading
    }
  })
  const dispatch = useDispatch()

  const setCurrentUni3Position = (posKey: string) => {
    if(posKey) {
      dispatch(setCurrentUni3Pos({ uni3Pos: posKey }))
    }
  }

  const setAllUni3Positions = (uni3Positions: {[key: string]: IUniPosV3}) => {

    if(Object.keys(uni3Positions).length > 0) {
      dispatch(setAllUni3Pos({ uni3Positions: uni3Positions}))
    }
  }
  const setUni3Position = (uni3Position: IUniPosV3, key:string) => {
    dispatch(setUni3Pos({ key ,uni3Pos: uni3Position}))
  }
  const setUni3Status = (loading: boolean) => {
    dispatch(setUni3Loading({loading}))
  }
  
  const displayUni3Positions = useMemo(() => {
    const displayUni3Poss: {[key:string]: IDisplayUniPosV3} = {}
    Object.keys(uni3Positions).map(uni3PosKey => {
      if(!uni3PosKey || !uni3Positions?.[uni3PosKey] || Number(uni3Positions[uni3PosKey]?.liquidity) === 0) return;
      const { tickLower, tickUpper,token0, token1, token0Data, token1Data, poolState, liquidity, fee, feeGrowthInside1LastX128, feeGrowthInside0LastX128 } = uni3Positions?.[uni3PosKey]
      const {slot0} = poolState as IUniPoolV3
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
      const totalPositionByToken1 = posLiquidityToken1 + posLiquidityToken0 * (px * diffDecimals)  

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
    useFetchUni3Position,
    displayUni3Positions,
    setUni3Status,
    uni3Loading,
    uni3Positions,
    currentUni3Position: currentUni3Position ? uni3Positions?.[currentUni3Position] : undefined,
    currentDisplayUni3Position: currentUni3Position ? displayUni3Positions?.[currentUni3Position] : undefined,
    setCurrentUni3Position,
    setUni3Position,
    setAllUni3Positions,
  }
}

export const useFetchUni3Position = () => {
  const { ddlEngine } = useConfigs()
  const { account } = useWeb3React()
  const {setCurrentUni3Position, setAllUni3Positions, uni3Positions, setUni3Status, uni3Loading} = useUni3Position()
  const fetchUni3Pos = async (): Promise<{[key: string]: IUniPosV3}>  => {
    let accountUni3Pos:{[key: string]: IUniPosV3} = {}
    if(ddlEngine && account && ddlEngine.RESOURCE.allLogs.length > 0 && Object.keys(uni3Positions).length === 0){
      const accountAssets = ddlEngine.RESOURCE.updateAssets({account, logs: ddlEngine.RESOURCE.allLogs})
      try {
        setUni3Status(true)
        if(Object.keys(accountAssets[721].balance).length === 0) throw "Account has no positions"
        const _accountUni3Pos = await ddlEngine.BNA.loadUniswapV3Position({assetsOverride: accountAssets})
        Object.keys(_accountUni3Pos).map(key => {
          if(_accountUni3Pos[key].liquidity === '0') return;
          accountUni3Pos[key] = _accountUni3Pos[key]
        })
        setUni3Status(false)
      } catch (error) {
        setUni3Status(false)
        console.log(error)
      }
      setAllUni3Positions( accountUni3Pos)
      if(Object.keys(accountUni3Pos)[0]) {
        setCurrentUni3Position(Object.keys(accountUni3Pos)[0])
      }
    }
    return accountUni3Pos
  }
  return {
    fetchUni3Pos,
    uni3Loading
  }
}
export const APPROXIMATELY_PX_PERCENT = 2
export const useFindMatchingPoolIndex = () => {
  const { configs } = useConfigs()
  const { convertNativeAddressToWrapAddress } = useHelper()
  const { displayUni3Positions,currentDisplayUni3Position} = useUni3Position()

  const {tokens} = useListTokens()

  const {poolGroups} = useResource()
  const getTokenIdentifier = useCallback((token: string) => tokens[token]?.symbol || tokens[token]?.name, [tokens]);

  const findMatchingPoolIndex = useCallback((indexKeyOverride?: any) => {
    if (!currentDisplayUni3Position) return null;

    const { token0, token1, token0Data, token1Data, px} = currentDisplayUni3Position;

    const sameStableCoin = ((configs.stablecoins.includes(token0) || configs.stablecoins.includes(token1))
      ? configs.stablecoins
      : []
    ).map((sbCoin) => tokens[sbCoin]);

    const posTokens = uniq([
      token0,
      token1,
      convertNativeAddressToWrapAddress(token0),
      convertNativeAddressToWrapAddress(token1),
      token0Data.symbol,
      token1Data.symbol,
      ...sameStableCoin.map((sbToken) => sbToken.address),
      ...sameStableCoin.map((sbToken) => sbToken.symbol),
    ]);
    const checkMatchPool = ({indexKey, indexOverride}:{indexKey:string, indexOverride?: any}): string | null  => {
      const { baseToken, quoteToken, basePrice} = indexOverride || poolGroups[indexKey];
      const baseTokenSymbol = getTokenIdentifier(baseToken);
      const quoteTokenSymbol = getTokenIdentifier(quoteToken);

      if (
        posTokens.includes(convertNativeAddressToWrapAddress(baseToken)) &&
        posTokens.includes(convertNativeAddressToWrapAddress(quoteToken))
      ) {
        return indexKey;
      } 
      if (
        posTokens.includes(baseTokenSymbol) &&
        posTokens.includes(quoteTokenSymbol)
      ) {
        return indexKey;
      }
      if(px * (1 - APPROXIMATELY_PX_PERCENT / 100) <= Number(basePrice) && Number(basePrice) <= px * (1 + APPROXIMATELY_PX_PERCENT / 100)) {
        return indexKey;
      }
      return null
    }
    // Check manual single index
    if(indexKeyOverride) {
      return checkMatchPool({indexKey: indexKeyOverride, indexOverride: poolGroups[indexKeyOverride]})
    }

    for (const indexKey of Object.keys(poolGroups)) {
      const matchIndexKey = checkMatchPool({indexKey})
      if(matchIndexKey) return matchIndexKey
    }
   
    return null;
  }, [currentDisplayUni3Position, poolGroups, configs.stablecoins, tokens]);
  return {
    findMatchingPoolIndex
  }
}