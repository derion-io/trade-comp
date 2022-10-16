import React, { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import './component.scss'

export default ({
  theme,
  useWeb3React,
  useSubPage,
  xStorageClient
}: {
  theme: string
  useWeb3React: any
  useSubPage: any
  xStorageClient: any
}) => {
  const { account } = useWeb3React()
  const subPage = useSubPage()
  const [referrerAddress, setReferrerAddress] = useState<any>('')

  useEffect(() => {
    if (xStorageClient) {
      xStorageClient
        .get('LZ_REFERRAL')
        .then((address: string) =>
          address ? ethers.utils.getAddress(address) : undefined
        )
        .then(setReferrerAddress)
        .catch(console.error)
    }
  }, [xStorageClient])

  return (
    <div className='mockup-dapp'>
      <p>Path: {subPage}</p>
      <p>Account: {account}</p>
      <p>Referrer address: {referrerAddress}</p>
    </div>
  )
}
