import { toBlob, toPng } from 'html-to-image'
import React, { useMemo, useRef } from 'react'
import isEqual from 'react-fast-compare'
import { toast } from 'react-toastify'
import { useWindowSize } from '../../hooks/useWindowSize'
import { useHelper } from '../../state/config/useHelper'
import { useResource } from '../../state/resources/hooks/useResource'
import { useListTokens } from '../../state/token/hook'
import { POOL_IDS } from '../../utils/constant'
import {
  NUM,
  decodeErc1155Address,
  div,
  downloadImage,
  formatPercent,
  getPoolPower,
  getTwitterIntentURL,
  isErc1155Address,
  isUSD,
  sub,
  zerofy
} from '../../utils/helpers'
import { Position } from '../../utils/type'
import { ButtonBorder } from '../ui/Button'
import { CopyIcon, DerionIconSmall, DownloadIcon, TwitterIcon } from '../ui/Icon'
import { Modal } from '../ui/Modal'
import { Text, TextGrey } from '../ui/Text'
import './style.scss'
const imgConfig = { quality: 0.95, canvasWidth: 1024, canvasHeight: 600 }

interface ClipboardItem {
  readonly types: string[];
  readonly presentationStyle: 'unspecified' | 'inline' | 'attachment';
  getType(): Promise<Blob>;
}

interface ClipboardItemData {
  [mimeType: string]: Blob | string | Promise<Blob | string>;
}

declare const ClipboardItem: {
  prototype: ClipboardItem;
  new (itemData: ClipboardItemData): ClipboardItem;
}

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
  const cardRef = useRef<HTMLDivElement>(null)
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
      const _pnl = NUM(div(sub(position.valueR, position.entryValueR), position.entryValueR))
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

  async function handleDownload() {
    const element = cardRef.current
    if (!element) return
    const imgBlob = await toPng(element, imgConfig)
    await downloadImage(imgBlob, 'derivable-position.png')
  }

  async function handleCopy () {
    const element = cardRef.current
    if (!element) return
    const imgBlob = await toBlob(element, imgConfig)
    if (!imgBlob) return
    try {
      await (navigator.clipboard as any).write([
        new ClipboardItem({
          [imgBlob.type]: imgBlob
        })
      ])
      toast.success('Copy image to clipboard successfully!')
    } catch (error) {
      toast.error('Copy image to clipboard error!')
    }
  }

  const tweetLink = getTwitterIntentURL(
    `Long/Short $${base} on the first ever Perpetuals AMM Protocol @DerivableLabs`,
    'https://app.derion.io/'
  )
  return (
    <Modal
      setVisible={setVisible}
      visible={visible}
      width={isPhone ? '100%' : '600px'}
    >
      <div className='position-share-modal '>
        <div className='position-share long' ref={cardRef}>
          <DerionIconSmall width={200} className='logo'/>
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
              <Text fontSize={isPhone ? 12 : 14}>Trade now at <b>app.derion.io</b></Text>
            </div>
          </div>
          <div className='date'>
            <TextGrey>Date: {(new Date()).toLocaleDateString()}</TextGrey>
          </div>
        </div>
        <div className='actions'>

          <ButtonBorder fill='white' className='actions-button' onClick={() => handleCopy()}>
            <CopyIcon/>{' '} Copy Image
          </ButtonBorder>

          <ButtonBorder fill='white' className='actions-button' onClick={() => handleDownload()}>
            <DownloadIcon/> {' '} Download
          </ButtonBorder>
          <ButtonBorder fill='white'className='actions-button' >
            <a style={{ color: 'white', textDecoration: 'none' }} target='_blank' href={tweetLink} rel='noreferrer'>
              <TwitterIcon/> {' '} Tweet
            </a>
          </ButtonBorder>
        </div>
      </div>
    </Modal>
  )
}

export const SharedPosition = React.memo(Component, (prevProps, nextProps) =>
  isEqual(prevProps, nextProps)
)
