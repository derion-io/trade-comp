import { useDispatch, useSelector } from 'react-redux'
import { State } from '../../types'
import { useResource } from '../../resources/hooks/useResource'
import { setCurrentPoolAddressReduce, setDrcReduce } from '../reducer'

export const useCurrentPool = () => {
  const { pools } = useResource()
  const { currentPoolAddress, drC } = useSelector((state: State) => {
    return {
      currentPoolAddress: state.currentPool.currentPoolAddress,
      drC: state.currentPool.drC
    }
  })
  const dispatch = useDispatch()

  const setCurrentPoolAddress = (address: string) => {
    dispatch(setCurrentPoolAddressReduce({ address }))
  }

  const setDrC = (r: number) => {
    dispatch(setDrcReduce({ r }))
  }

  return {
    drC,
    currentPool: pools[currentPoolAddress] || {},
    setCurrentPoolAddress,
    setDrC
  }
}
