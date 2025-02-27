import {IUniPosV3} from 'derivable-engine/dist/services/balanceAndAllowance'
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
export interface IDisplayUniPosV3 {
  pxLower: string,
  pxUpper: string,
  liquidityByQuote: string,
  liquidityByBase: string,
  token0Data: TokenType,
  token1Data: TokenType
  feeGrowthInside0Last: string,
  feeGrowthInside1Last: string,
  fee: string,
  tickLower: number,
  tickUpper: number,
  liquidity: string,
  feeGrowthInside0LastX128: string,
  feeGrowthInside1LastX128: string,
  tokensOwed0: string,
  tokensOwed1: string,
}
export const useUni3Position = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const prices = useTokenPrice()
  const { configs, ddlEngine } = useConfigs()
  const { provider, chainId,account } = useWeb3React()
  const { tokens } = useListTokens()
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
  
  const displayUni3Positions = useMemo(async () => {
    const displayUni3Poss:{[key: string]: any} = {}
    Object.keys(uni3Positions).map(uni3PosKey => {
      if(!uni3PosKey || !uni3Positions?.[uni3PosKey]) return;
      const { tickLower, tickUpper,token0, token1, liquidity, fee, feeGrowthInside1LastX128, feeGrowthInside0LastX128 } = uni3Positions?.[uni3PosKey]
      if(!tokens[token0] || !tokens[token1]) return;
      const token0Data = tokens[token0]
      const token1Data = tokens[token1]
      const diffDecimals = Math.abs(token0Data?.decimals - token1Data?.decimals)
      const pxLower = String(calculatePx(tickLower) * 10 ** diffDecimals)
      const pxUpper = String(calculatePx(tickUpper) * 10 ** diffDecimals)
      displayUni3Poss[uni3PosKey] = {
        pxLower,
        pxUpper,
        token0Data,
        token1Data,
        fee,
        feeGrowthInside0LastX128,
        feeGrowthInside1LastX128,
      }
    })
    return displayUni3Poss
  },[uni3Positions, tokens, prices])
  return {
    loading,
    useFetchUni3Position,
    displayUni3Positions,
    error,
    uni3Positions,
    currentUni3Position: currentUni3Position ? uni3Positions?.[currentUni3Position] : undefined,
    setCurrentUni3Position,
    setUni3Position,
    setAllUni3Positions,
  }
}



export const useFetchUni3Position = () => {
  const { configs, ddlEngine } = useConfigs()
  const { provider, chainId,account } = useWeb3React()
  const { tokens } = useListTokens()
  const {setAllUni3Positions, setCurrentUni3Position, currentUni3Position} = useUni3Position()

  const fetchUni3Pos = async (): Promise<{[key: string]: IUniPosV3}>  => {
    let accountUni3Pos:{[key: string]: IUniPosV3} = {}
    if(ddlEngine && account){
      const cacheLogs = ddlEngine.RESOURCE.getCachedLogs(account)
      const accountAssets = ddlEngine.RESOURCE.updateAssets({account, logs: cacheLogs})
      try {
        accountUni3Pos = await ddlEngine.BNA.loadUniswapV3Position(accountAssets)
      } catch (error) {
        console.log(error)
      }
      setAllUni3Positions(accountUni3Pos)
      if(!currentUni3Position) {
        setCurrentUni3Position(Object.keys(accountUni3Pos)[0])
      }
    }
    return accountUni3Pos
  }
 
  useEffect(() => {
    fetchUni3Pos()
  }, [ddlEngine, tokens, chainId, configs.name])

}