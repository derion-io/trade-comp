import React, { useEffect, useMemo, useState } from 'react'
import './style.scss'
import { ExposureBox } from '../../Components/ExposureBox'
import { PoolTable } from '../../Components/PoolTable'
import { TextBlue } from '../../Components/ui/Text'
import { IconArrowLeft } from '../../Components/ui/Icon'
import { useConfigs } from '../../state/config/useConfigs'
import { useCurrentPool } from '../../state/currentPool/hooks/useCurrentPool'
import { useHelper } from '../../state/config/useHelper'

export const Exposure = () => {
  const { cToken, quoteToken, baseToken } = useCurrentPool()
  const { useHistory } = useConfigs()
  const history = useHistory()
  const { get24hChange } = useHelper()
  const [changedIn24h, setChangedIn24h] = useState<number>(0)

  useEffect(() => {
    if (baseToken && quoteToken && cToken) {
      get24hChange(baseToken, cToken, quoteToken).then((value) => {
        console.log('khanh', value)
        setChangedIn24h(value)
      })
    }
  }, [cToken, quoteToken, baseToken])

  return (
    <div className='exposure-page'>
      <div className='exposure-page__head'>
        <div
          className='exposure-page__head--back-btn'
          onClick={() => {
            history.push('pools')
          }}
        >
          <IconArrowLeft fill='#01A7FA' /> <TextBlue>Back</TextBlue>
        </div>
      </div>
      <div className='exposure-page__content'>
        <ExposureBox changedIn24h={changedIn24h}/>
        <PoolTable />
      </div>
    </div>
  )
}
