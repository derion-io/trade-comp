import { ethers } from 'ethers'
import { useConfigs } from '../../config/useConfigs'
// eslint-disable-next-line no-unused-vars
import { State } from '../../types'
import { useDispatch, useSelector } from 'react-redux'
import { useEffect } from 'react'
import { addFeeDataWithChain } from '../reducer'

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
  const { chainId, configs } = useConfigs()
  const dispatch = useDispatch()

  useEffect(() => {
    fetchFeeData()
  }, [configs, chainId])

  const fetchFeeData = () => {
    const provider = new ethers.providers.JsonRpcProvider(configs.rpcUrl)
    provider.getFeeData().then((data:any) => {
      dispatch(addFeeDataWithChain({
        feeData: data,
        chainId
      }))
    })
  }
}
