import { useDispatch, useSelector } from 'react-redux'
import { State } from '../../types'
import { useResource } from '../../resources/hooks/useResource'
import { setCurrentPoolAddressReduce, setDrReduce } from '../reducer'

export const useCurrentPool = () => {
  const { pools } = useResource()
  const { currentPoolAddress, drA, drB, drC } = useSelector((state: State) => {
    return {
      currentPoolAddress: state.currentPool.currentPoolAddress,
      drA: state.currentPool.drA,
      drB: state.currentPool.drB,
      drC: state.currentPool.drC,
    }
  })
  const dispatch = useDispatch()

  const setCurrentPoolAddress = (address: string) => {
    dispatch(setCurrentPoolAddressReduce({ address }))
  }

  const setDr = (drA: number, drB: number, drC: number) => {
    dispatch(setDrReduce({ drA, drB, drC }))
  }

  return {
    drA, drB, drC,
    currentPool: pools[currentPoolAddress] || {},
    setCurrentPoolAddress,
    setDr,
  }
}
