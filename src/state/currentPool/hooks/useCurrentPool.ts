import { useDispatch, useSelector } from 'react-redux'
import { State } from '../../types'
import { useResource } from '../../resources/hooks/useResource'
import { setCurrentPoolAddressReduce, setDrReduce, setPriceQuote } from '../reducer'

export const useCurrentPool = () => {
  const { pools } = useResource()
  const { currentPoolAddress, drA, drB, drC, priceByIndexR } = useSelector((state: State) => {
    return {
      currentPoolAddress: state.currentPool.currentPoolAddress,
      drA: state.currentPool.drA,
      drB: state.currentPool.drB,
      drC: state.currentPool.drC,
      priceByIndexR: state.currentPool.priceByIndexR
    }
  })
  const dispatch = useDispatch()

  const setCurrentPoolAddress = (address: string) => {
    dispatch(setPriceQuote({ status: false }))
    dispatch(setCurrentPoolAddressReduce({ address }))
  }

  const setDr = (drA: number, drB: number, drC: number) => {
    dispatch(setDrReduce({ drA, drB, drC }))
  }

  return {
    drA,
    drB,
    drC,
    priceByIndexR,
    currentPool:
      pools && pools[currentPoolAddress] ? pools[currentPoolAddress] : {},
    setCurrentPoolAddress,
    setDr
  }
}
