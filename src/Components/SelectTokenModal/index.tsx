import React, { useMemo, useState } from 'react'
import { Modal } from '../ui/Modal'
import { Box } from '../ui/Box'
import { useListTokens } from '../../state/token/hook'
import { TokenIcon } from '../ui/TokenIcon'
import { useWalletBalance } from '../../state/wallet/hooks/useBalances'
import { TokenSymbol } from '../ui/TokenSymbol'
import { Text, TextGrey } from '../ui/Text'
import './style.scss'
import isEqual from 'react-fast-compare'
import { useResource } from '../../state/resources/hooks/useResource'
import {
  decodeErc1155Address,
  isErc1155Address,
  IEW,
  NUM,
  zerofy,
} from '../../utils/helpers'
import { ZERO_ADDRESS } from '../../utils/constant'
import { useTokenValue } from '../SwapBox/hooks/useTokenValue'
import { CurrencyLogo } from '../ui/CurrencyLogo'
import { useHelper } from '../../state/config/useHelper'
import { useSettings } from '../../state/setting/hooks/useSettings'
function hasInvalidSymbol(symbol: string): boolean {
  return /\s|[^a-zA-Z]/.test(symbol)
}
const Component = ({
  visible,
  setVisible,
  tokens: tokensToSelect,
  onSelectToken,
  displayFee = false
}: {
  visible: boolean
  setVisible: any
  tokens: string[]
  onSelectToken: any
  displayFee?: boolean
}) => {
  const [tokensWithLogo, setTokensWithLogo] = useState<{
    logo: string,
    address: string,
    symbol:string,
  }[]>([])
  const { getTokenIconUrl } = useHelper()
  const [isShowMore, setIsShowMore] = useState(false)
  const { getTokenValue } = useTokenValue({})
  const { tokens } = useListTokens()
  const { balances } = useWalletBalance()
  const { settings } = useSettings()
  useMemo(async () => {
    const tokensLogo:{
      logo: string,
      address: string,
      symbol:string,
    }[] = []
    await Promise.all(
      tokensToSelect.map(async (address) => {
        const tokenLogo = {
          logo: isErc1155Address(address)
            ? ''
            : await getTokenIconUrl(address),
          address,
          symbol: tokens[address].symbol
        }
        tokensLogo.push(tokenLogo)
      })
    )
    console.log('#tokensLogo', tokensLogo)
    setTokensWithLogo(tokensLogo.sort((a, b) => {
      if (a.logo === 'notfound' && b.logo !== 'notfound') {
        return 1
      }
      if (a.logo !== 'notfound' && b.logo === 'notfound') {
        return -1
      }
      if (a.logo && !b.logo) {
        return -1
      }
      if (!a.logo && b.logo) {
        return 1
      }
      if (hasInvalidSymbol(a.symbol) && !hasInvalidSymbol(b.symbol)) {
        return 1
      }
      if (!hasInvalidSymbol(a.symbol) && hasInvalidSymbol(b.symbol)) {
        return -1
      }
      return 0
    })
    )
  }, [tokensToSelect, tokens])

  return (
    <Modal setVisible={setVisible} visible={visible} title='Select Token'>
      <div className='select-token-modal'>
        {tokensWithLogo.map(({ address, logo }, key: number) => {
          if (NUM(getTokenValue(
            address,
            IEW(balances[address], tokens[address]?.decimals || 18)
          )) < settings.minPositionValueUSD && !isShowMore) {
            return
          }
          return (
            <Option
              key={key}
              currencyURI={logo || ''}
              address={address}
              setVisible={setVisible}
              onSelectToken={onSelectToken}
            />
          )
        })}
      </div>
      <div className='search-model-footer'>
        <TextGrey className='select-token-showmore' onClick={() => {
          setIsShowMore(isShowMore !== true)
        }}> {isShowMore ? 'Hide Unknown Tokens' : 'Show Unknown Tokens'}</TextGrey>
      </div>
    </Modal>
  )
}

const Option = ({
  onSelectToken,
  address,
  setVisible,
  currencyURI,
  isCheckTokenValue,
}: {
  setVisible: any
  currencyURI: string
  address: string
  onSelectToken: any
  isCheckTokenValue?: boolean
}) => {
  const { tokens } = useListTokens()
  const { pools } = useResource()
  const { balances } = useWalletBalance()
  const { settings } = useSettings()
  const { value } = useTokenValue({
    tokenAddress: address,
    amount: IEW(balances[address], tokens[address]?.decimals || 18)
  })
  const [reserve, tokenR] = useMemo(() => {
    if (isErc1155Address(address)) {
      const { address: poolAddress } = decodeErc1155Address(address)
      const pool = pools[poolAddress]

      return [IEW(pool.states.R, tokens[pool.TOKEN_R].decimals), pool.TOKEN_R]
    }
    return ['0', ZERO_ADDRESS]
  }, [])
  const { value: price } = useTokenValue({
    tokenAddress: tokenR,
    amount: reserve
  })

  const symbol = <TokenSymbol token={address} />
  return (
    <Box
      className='option'
      onClick={() => {
        onSelectToken(address)
        setVisible(false)
      }}
    >
      {/* {!isErc1155Address(address) ? (
        <TokenIcon currencyURI={currencyURI} size={24} />
      ) : ( */}
      <TokenIcon tokenAddress={address} size={24} />
      {/* )} */}
      <div className='option__name-and-lp'>
        <Text>{symbol}</Text>
        {price && Number(price) > 0 ? (
          <div>
            <TextGrey>${zerofy(NUM(price))}</TextGrey>
          </div>
        ) : (
          ''
        )}
      </div>
      {balances[address] && balances[address].gt(0) && (
        <div className='option__balance'>
          <Text>
            {zerofy(
              NUM(IEW(balances[address], tokens[address]?.decimals ?? 18))
            )}
          </Text>
          {NUM(value) !== 0 ? <TextGrey>${zerofy(NUM(value))}</TextGrey> : ''}
        </div>
      )}

    </Box>
  )
}

export const SelectTokenModal = React.memo(Component, (prevProps, nextProps) =>
  isEqual(prevProps, nextProps)
)
