import React from 'react'
import {SvgSpinners12DotsScaleRotate} from '../../ui/Icon'
export const PositionLoadingComponent = () => {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      width: '100%', 
      minHeight: '50px'  // min Height of Position & History tabs
    }}>
      <SvgSpinners12DotsScaleRotate width={'38px'} height={'38px'}/>
    </div>
  )
}
