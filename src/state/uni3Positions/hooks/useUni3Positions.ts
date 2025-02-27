import {IUniPosV3} from 'derivable-engine/dist/services/balanceAndAllowance'
import {useEffect,useState} from 'react'
import {useDispatch,useSelector} from 'react-redux'
import {useConfigs} from '../../config/useConfigs'
import {useWeb3React} from '../../customWeb3React/hook'
import {useResource} from '../../resources/hooks/useResource'
import {useListTokens} from '../../token/hook'
import {State} from '../../types'
import {setAllUni3Pos,setCurrentUni3Pos,setUni3Pos} from '../reducer'
export const useCurrentUni3Position = () => {
  const { pools } = useResource()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
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

  const fetchUni3Pos = async (): Promise<{[key: string]: IUniPosV3}>  => {
    let accountUni3Pos:{[key: string]: IUniPosV3} = {}
    if(ddlEngine && account){
      setLoading(true)
      const cacheLogs = ddlEngine.RESOURCE.getCachedLogs(account)
      const accountAssets = ddlEngine.RESOURCE.updateAssets({account, logs: cacheLogs})
      try {
        accountUni3Pos = await ddlEngine.BNA.loadUniswapV3Position(accountAssets)
      } catch (error) {
        setError(error?.msg || error?.reason || error?.code)
        setLoading(false)
      }
      setAllUni3Positions(accountUni3Pos)
      if(!currentUni3Position) {
        setCurrentUni3Position(Object.keys(accountUni3Pos)[0])
      }
      setLoading(false)
    }
    return accountUni3Pos
  }

  useEffect(() => {
    fetchUni3Pos()
  },[ddlEngine, account])

  return {
    loading,
    error,
    uni3Positions,
    currentUni3Position: currentUni3Position ? uni3Positions?.[currentUni3Position] : undefined,
    setCurrentUni3Position,
    setUni3Position,
    setAllUni3Positions,
    fetchUni3Pos
  }
}
