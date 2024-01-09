import moment from 'moment'
import React from 'react'
import { PoolGroupValueType, PoolType } from '../../../state/resources/type'
import formatLocalisedCompactNumber from '../../../utils/formatBalance'
import { IEW, NUM, bn, formatFloat, poolToIndexID, unwrap, zerofy } from '../../../utils/helpers'
import { PoolSearch } from '../../../utils/type'
import { CurrencyGroupLogo } from '../../ui/CurrencyGroupLogo'
import { SkeletonLoader } from '../../ui/SkeletonLoader'
import { Text, TextGrey } from '../../ui/Text'
import './index.scss'
import { useTokenValue } from '../../SwapBox/hooks/useTokenValue'
import { useListTokens } from '../../../state/token/hook'
import { MIN_POSITON_VALUE_USD_TO_DISPLAY } from '../../../utils/constant'
import { useWalletBalance } from '../../../state/wallet/hooks/useBalances'
import { TokenIcon } from '../../ui/TokenIcon'
type Props = {
  poolsFilterSearch: PoolSearch[],
  poolGroupsValue?: PoolGroupValueType
  handlePoolSelect: (pool: PoolSearch, hasWarning?: boolean) => void
  isLoading: boolean
}
export const ListCurrencies = ({ poolsFilterSearch, poolGroupsValue, isLoading = false, handlePoolSelect }: Props) => {
  const { getTokenValue } = useTokenValue({})
  const { tokens } = useListTokens()
  const { balances } = useWalletBalance()
  console.log('#poolGroupsValue', poolGroupsValue)
  return (
    <div className='token-list'>
      <div>
        {/* {poolsFilterSearch.length > 0 && (
          <tr className='table-head'>
            <th />
          </tr>
        )} */}
        {poolsFilterSearch.map((index, _) => {
          return index.pools.map((pool, __) => {
            const poolValue = NUM(getTokenValue(
              pool?.TOKEN_R,
              IEW(pool?.states?.R, tokens[pool?.TOKEN_R]?.decimals),
              true
            ))
            const poolValueR = NUM(IEW(pool?.states?.R, tokens[pool?.TOKEN_R]?.decimals))
            return (
              <div key={_ + __} className='position-token-list'>
                <div
                  className='position-token-list__table'
                  onClick={() => handlePoolSelect({
                    baseToken: index.baseToken,
                    quoteToken: index.baseToken,
                    pools: [pool]
                  })}
                >
                  <div className='token-item'>
                    <span className='chart-token-selector--current inline-items-center'>
                      <CurrencyGroupLogo currencyURIs={[index.baseToken.logoURI, index.quoteToken.logoURI]} size={36}/>
                      <div className='chart-token-symbol'>
                        <Text>
                          {unwrap(index.baseToken.symbol)}/{unwrap(index.quoteToken.symbol)}
                        </Text><br/>
                        <TextGrey>  {pool?.timeStamp ? moment
                          .unix(pool?.timeStamp)
                          .fromNow()
                          .toLocaleLowerCase() : ''} </TextGrey>
                      </div>

                    </span>
                    <span className='inline-items-center' />
                  </div>

                  <div className='index-value-item'>
                    {poolValueR > 0
                      ? <TextGrey>{`${zerofy(poolValueR)} ${unwrap(tokens[pool?.TOKEN_R].symbol)}`}<br/></TextGrey>
                      : <SkeletonLoader textLoading='   ' loading/>}

                    {poolValue > 0
                      ? <TextGrey>{`$${formatLocalisedCompactNumber(formatFloat(poolValue))}` }</TextGrey>
                      : <SkeletonLoader textLoading='   ' loading/>}
                  </div>
                </div>
                <div className='pool-positions-list__wrap'>
                  <TextGrey>Positions</TextGrey>
                  <div className='pool-positions-list'>
                    {poolGroupsValue ? poolGroupsValue?.[poolToIndexID(pool)]?.poolGroupPositions.map((playingToken:any) => {
                      const { address, value } = playingToken
                      if (value < MIN_POSITON_VALUE_USD_TO_DISPLAY) return null
                      if (balances[address] && bn(balances[address]).gt(0)) {
                        return <TokenIcon key={address} size={20} tokenAddress={address} />
                      } else {
                        return null
                      }
                    }) : ''}
                  </div>
                </div>
              </div>
            )
          })
        })}
      </div>
      {isLoading && Array(8).fill(0).map((a, _) => <SkeletonLoader height='50px' key={_} loading style={{ width: '100%', marginTop: '1rem' }}/>)}
      <div className='search-model-footer'><TextGrey>Enter to search more</TextGrey></div>
    </div>
  )
}
