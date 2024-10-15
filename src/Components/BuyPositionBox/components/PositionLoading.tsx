import React, {Fragment} from 'react'
import { useWindowSize } from '../../../hooks/useWindowSize'
import { SkeletonLoader } from '../../ui/SkeletonLoader'
import { useCurrentPoolGroup } from '../../../state/currentPool/hooks/useCurrentPoolGroup'
import { TRADE_TYPE } from '../../../utils/constant'
import {InfoRow} from '../../ui/InfoRow'
import LineChartLoaderSVG from '../../ChartLoaders/LineChartLoaderSVG'
import {SvgSpinners12DotsScaleRotate} from '../../ui/Icon'
import {Card} from 'antd'
import {Box} from '../../ui/Box'
const POSITION_LOADING_COUNT = 3
export const PositionLoadingComponents = () => {
  const { width } = useWindowSize()
  const isPhone = width && width < 992
  const { tradeType } = useCurrentPoolGroup()

  const showSize = tradeType !== TRADE_TYPE.LIQUIDITY
  const skeletonCount = showSize ? 6 : 5

  // if (isPhone) {
  //   return <Fragment>
  //   {Array.from({ length: POSITION_LOADING_COUNT }).map((id, _) => {
  //     return (
  //       <InfoRow key={_}>
  //             <SkeletonLoader loading={true} style={{ width: '100%', marginBottom:'1rem'}} height='50px'/>
  //       </InfoRow>
  //     )
  //   })}
  // </Fragment>
  // } else {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        width: '100%', 
        minHeight: '160px'  // min Height of Position & History tabs
      }}>
        <SvgSpinners12DotsScaleRotate width={'36px'} height={'36px'}/>
      </div>
    )
  // }
}
