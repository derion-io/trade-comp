import React, { useEffect } from 'react'
import './style.scss'
import { Text, TextBlue, TextGreen, TextLink, TextPink } from '../../ui/Text'

export const ExpandPool = ({ visible }: any) => {
  useEffect(() => {

  }, [])

  return <div className='pool-expand__wrap'>
    <div className='pool-expand'>
      <div className='pool-expand__top'>
        <div className='pool-expand__top--left'>
          <p className='mb-1'><TextPink >Get ETH-USDT LP</TextPink></p>
          <p className='mb-1'><TextLink>View Contract</TextLink></p>
        </div>
        <div className='pool-expand__top--mid'>
          <p><Text >Total Supply</Text></p>
          <p><TextBlue>ETH2: 1000</TextBlue></p>
          <p><TextBlue>ETH8: 1000</TextBlue></p>
        </div>
        <div className='pool-expand__top--right'>
          <p><Text >Collateral Ratio</Text></p>
          <p><TextBlue>1.5</TextBlue></p>
          <p><TextBlue>2.0</TextBlue></p>
        </div>
      </div>
      <div className='pool-expand__bottom'>
        <div className='pool-expand__bottom--left'>
          <Text>Price Tolenrance Ratio:</Text><TextGreen> 1.6</TextGreen>
        </div>
        <div className='pool-expand__bottom--mid'>
          <Text>Fee Base:</Text><TextGreen> 1%</TextGreen>
        </div>
        <div className='pool-expand__bottom--right'>
          <Text>Fee Rate:</Text><TextGreen> 0.5%</TextGreen>
        </div>
      </div>
    </div>
  </div>
}
