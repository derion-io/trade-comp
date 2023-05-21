import React, { useMemo } from 'react'
import { Modal } from '../ui/Modal'
import { Box } from '../ui/Box'
import { useListTokens } from '../../state/token/hook'
import { TokenIcon } from '../ui/TokenIcon'
import { useWalletBalance } from '../../state/wallet/hooks/useBalances'
import { TokenSymbol } from '../ui/TokenSymbol'
import { Text, TextGrey } from '../ui/Text'
import './style.scss'
import { formatWeiToDisplayNumber } from '../../utils/formatBalance'
import isEqual from 'react-fast-compare'
import { useListPool } from '../../state/resources/hooks/useListPool'
import { decodeErc1155Address, div, isErc1155Address, weiToNumber } from '../../utils/helpers'
import { POOL_IDS } from '../../utils/constant'

const Component = ({
                     visible,
                     setVisible,
                     tokens: tokensToSelect,
                     onSelectToken,
                     displayFee = false
                   }: {
  visible: boolean,
  setVisible: any,
  tokens: string[],
  onSelectToken: any,
  displayFee?: boolean
}) => {
  return <Modal
    setVisible={setVisible}
    visible={visible}
    title='Select token'
  >
    <div className='select-token-modal'>
      {
        tokensToSelect.map((address: any, key: number) => {
          return <Option
            key={key}
            address={address}
            setVisible={setVisible}
            onSelectToken={onSelectToken}
          />
        })
      }
    </div>
  </Modal>
}

const Option = ({ onSelectToken, address, setVisible }: {
  setVisible: any,
  address: string,
  onSelectToken: any
}) => {
  const { tokens } = useListTokens()
  const { pools } = useListPool()
  const { balances } = useWalletBalance()

  const [lp, value, unit] = useMemo(() => {
    let lp = null
    let value = null
    let unit = null
    if (isErc1155Address(address)) {
      const { address: poolAddress, id } = decodeErc1155Address(address)
      const pool = pools[poolAddress]
      if (pool && pool.states) {
        lp = formatWeiToDisplayNumber(pool.states.R, 2, tokens[pool.TOKEN_R].decimals)
        // const price = div(pool.states.rA, pool.states.sA)
        const rX = Number(id) === POOL_IDS.A
          ? pool.states.rA
          : Number(id) === POOL_IDS.B ? pool.states.rB : pool.states.rB

        const sX = Number(id) === POOL_IDS.A
          ? pool.states.sA
          : Number(id) === POOL_IDS.B ? pool.states.sB : pool.states.sB

        value = formatWeiToDisplayNumber(
          balances[address].mul(rX).div(sX),
          2,
          tokens[address].decimals
        )
        unit = tokens[pool.TOKEN_R]?.symbol
      }
    } else {
      value = formatWeiToDisplayNumber(balances[address], 2, tokens[address].decimals)
      unit = tokens[address]?.symbol
    }
    return [lp, value, unit]
  }, [pools, address])

  const symbol = <TokenSymbol token={address} />
  return <Box
    className='option'
    onClick={() => {
      onSelectToken(address)
      setVisible(false)
    }}
  >
    <TokenIcon size={24} tokenAddress={address} />
    <div className='option__name-and-lp'>
      <Text>{symbol}</Text>
      {
        lp &&
        <div>
          <Text>LP: </Text>
          <Text>{lp}</Text>
          <TextGrey> {unit}</TextGrey>
        </div>
      }
    </div>
    <div>
      <Text>{value}</Text>
      <TextGrey> {unit}</TextGrey>
    </div>
  </Box>
}

export const SelectTokenModal = React.memo(Component, (prevProps, nextProps) =>
  isEqual(prevProps, nextProps)
)
