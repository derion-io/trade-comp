import React from 'react'
import {SvgSpinners12DotsScaleRotate} from '../../ui/Icon'
export const PositionLoadingComponents = () => {
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
