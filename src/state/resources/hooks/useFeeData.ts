import { useConfigs } from '../../config/useConfigs'
// eslint-disable-next-line no-unused-vars
import { State } from '../../types'
import { useDispatch, useSelector } from 'react-redux'
import { useEffect } from 'react'
import { addFeeDataWithChain } from '../reducer'
import { useWeb3React } from '../../customWeb3React/hook'

export const useFeeData = () => {
  const { chainId } = useConfigs()
  const { feeData } = useSelector((state: State) => {
    return {
      feeData: state.resources.feeData
    }
  })
  return {
    feeData: feeData[chainId]
  }
}

export const useFetchFeeData = () => {
  const { chainId } = useConfigs()
  const { provider } = useWeb3React()
  const dispatch = useDispatch()

  useEffect(() => {
    fetchFeeData()
  }, [chainId, provider])

  const fetchFeeData = () => {
    if (provider) {
      provider.getFeeData().then((data:any) => {
        dispatch(addFeeDataWithChain({
          feeData: data,
          chainId
        }))
      })
    }
  }
}
