import React, { useEffect, Fragment, useMemo, useState } from 'react'
import { CustomTokenIcon } from '../Icon'
import { useHelper } from '../../../state/config/useHelper'
import {
  decodeErc1155Address,
  getPoolPower,
  isErc1155Address
} from '../../../utils/helpers'
import './style.scss'
import { POOL_IDS } from '../../../utils/constant'
import { useResource } from '../../../state/resources/hooks/useResource'
import { useConfigs } from '../../../state/config/useConfigs'
const isLink = (str: string): boolean => {
  const urlPattern = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i
  return urlPattern.test(str)
}
export const TokenIcon = (props: {
  src?: string
  className?: string
  tokenAddress?: string
  size?: number
  iconSize?: string
}) => {
  const { pools } = useResource()
  const { configs } = useConfigs()
  const { getTokenIconUrl } = useHelper()
  const [tokenIcon, setTokenIcon] = useState<string>('')
  const [isError, setIsError] = useState<boolean>(!props.src)
  const style = {
    width: props.size || 50,
    height: props.size || 50,
    borderRadius: '50%'
  }

  const onError = () => {
    setIsError(true)
  }

  useEffect(() => {
    setIsError(false)
  }, [props.src])

  const poolToken = useMemo(() => {
    if (
      pools &&
      Object.values(pools).length > 0 &&
      props.tokenAddress &&
      isErc1155Address(props.tokenAddress)
    ) {
      const { id, address } = decodeErc1155Address(props.tokenAddress)
      const pool = pools[address]
      if (!pool) return null
      const power = getPoolPower(pool)
      if (Number(id) === POOL_IDS.C) {
        return (
          <div style={style} className='pool-token-logo pool-token-logo__cp'>
            LP
          </div>
        )
      } else {
        return (
          <div
            style={style}
            className={`pool-token-logo ${
              Number(id) === POOL_IDS.A
                ? 'pool-token-logo__long'
                : 'pool-token-logo__short'
            }`}
          >
            {Number(id) === POOL_IDS.A ? '+' : '-'}
            {power}
          </div>
        )
      }
    } else if (props.tokenAddress?.includes('-' + POOL_IDS.C)) {
      return (
        <div style={style} className='pool-token-logo pool-token-logo__lp'>
          LP
        </div>
      )
    }
    return ''
  }, [pools, props.tokenAddress])

  // useMemo(async () => {
  //   if (!poolToken) return
  //   if (props.src) setTokenIconUrl(props.src)
  //   setTokenIconUrl(await getTokenIconUrl(props.tokenAddress || ''))
  // }, [props, poolToken, tokenIconUrl])

  useMemo(async () => {
    if (configs.tokens?.[props?.tokenAddress || '']?.logo) {
      setTokenIcon(configs.tokens?.[props?.tokenAddress || '']?.logo)
      return
    }
    if (props.src) {
      setTokenIcon(props.src)
      return
    }
    if (!props.tokenAddress) {
      setTokenIcon('')
      return
    }
    setTokenIcon(await getTokenIconUrl(props.tokenAddress || ''))
  }, [pools, props.src, tokenIcon, props.tokenAddress])
  if (poolToken) {
    return <Fragment>{poolToken}</Fragment>
  }
  if (isError || tokenIcon === 'notfound' || !tokenIcon || tokenIcon === 'missing.png') {
    return <CustomTokenIcon size={props.size || 50} {...props} />
  } else {
    return isLink(tokenIcon)
      ? <img
        onError={onError}
        style={{
          width: props.size || 50,
          height: props.size || 50,
          borderRadius: '50%'
        }}
        {...props}
        src={tokenIcon}
      />
      : <span style={{ fontSize: props.iconSize ?? '1em' }} className = 'override-char'>
        {tokenIcon}
      </span>
  }
}
