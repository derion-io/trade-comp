import React, { useMemo } from 'react'
import isEqual from 'react-fast-compare'
import { useHelper } from '../../state/config/useHelper'
import { useResource } from '../../state/resources/hooks/useResource'
import { useListTokens } from '../../state/token/hook'
import {
  NUM,
  decodeErc1155Address,
  div,
  formatPercent,
  getPoolPower,
  isErc1155Address,
  isUSD,
  sub,
  zerofy
} from '../../utils/helpers'
import { POOL_IDS } from '../../utils/constant'
import { Position } from '../../utils/type'
import { Modal } from '../ui/Modal'
import './style.scss'
import { DerivableIconSmall } from '../ui/Icon'
import { Text, TextBlue, TextBuy, TextGrey, TextSell } from '../ui/Text'
import { useWindowSize } from '../../hooks/useWindowSize'
const Component = ({
  visible,
  setVisible,
  position
}: {
  visible: boolean
  setVisible: any,
  position: Position,
}) => {
  const { tokens } = useListTokens()
  const { pools } = useResource()
  const { wrapToNativeAddress } = useHelper()
  const { token } = position
  const { width } = useWindowSize()
  const isPhone = width && width < 768
  const [side, power, base, indexPrefix, pnl, pnlDisplay, entryPrice] = useMemo(() => {
    if (!pools) return []
    if (isErc1155Address(token)) {
      const { address: poolAddress, id } = decodeErc1155Address(token)
      const pool = pools[poolAddress]
      if (!pool) {
        return []
      }
      const { baseToken, quoteToken } = pool
      const _side =
        Number(id) === POOL_IDS.A
          ? 'Long'
          : Number(id) === POOL_IDS.B
            ? 'Short'
            : 'Liquidity'
      const _pnl = NUM(div(sub(position.value, position.entryValueR), position.entryValueR))
      const _pnlDisplay = formatPercent(_pnl)
      const _power = getPoolPower(pool)
      const _base = tokens[wrapToNativeAddress(baseToken)]?.symbol
      const quote = tokens[wrapToNativeAddress(quoteToken)]?.symbol
      const _indexPrefix = isUSD(quote ?? '') ? '' : `/${quote}`
      const _entryPrice = position.entryPrice
      return [_side, _power, _base, _indexPrefix, _pnl, _pnlDisplay, _entryPrice]
    }
    return []
  }, [tokens, token, pools])

  return (
    <Modal
      setVisible={setVisible}
      visible={visible}
      width={isPhone ? '100%' : '600px'}
    >
      <div className='position-share long'>
        <DerivableIconSmall width={300} className='logo'/>
        <p className='info' >
          <span>{base}{indexPrefix}</span> {' '} <span className={`side ${side?.toLowerCase()}`}> {side}</span>
        </p>
        <h3 className='pnl'>{
          pnl && pnl < 0
            ? <p className='pnl-text negative'>{pnlDisplay + '%'}</p>
            : <p className='pnl-text positive'>{pnlDisplay + '%'}</p>
        }</h3>
        <div className='prices'>

          <div>
            <p>Entry Price</p>
            <p className='price'>{zerofy(NUM(entryPrice || 0))}</p>
          </div>
          <div>
            <p>Leverage</p>
            <p className='price'>{power}x</p>
          </div>
        </div>
        <div className='referral-code'>
          <div />
          <div className='referral-code-info'>
            <Text fontSize={isPhone ? 12 : 14}>Trade now at <b>app.derivable.org</b></Text>
          </div>
        </div>
        <div className='date'>
          <TextGrey>Date: {(new Date()).toLocaleDateString()}</TextGrey>
        </div>
      </div>

    </Modal>
  )
}

export const SharedPosition = React.memo(Component, (prevProps, nextProps) =>
  isEqual(prevProps, nextProps)
)
