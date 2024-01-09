import moment from 'moment'
import React from 'react'
import { PoolGroupValueType, PoolType } from '../../../state/resources/type'
import formatLocalisedCompactNumber from '../../../utils/formatBalance'
import { IEW, NUM, formatFloat, unwrap, zerofy } from '../../../utils/helpers'
import { TokenFromPoolGroup } from '../../../utils/type'
import { CurrencyGroupLogo } from '../../ui/CurrencyGroupLogo'
import { SkeletonLoader } from '../../ui/SkeletonLoader'
import { Text, TextGrey } from '../../ui/Text'
import './index.scss'
import { useTokenValue } from '../../SwapBox/hooks/useTokenValue'
import { useListTokens } from '../../../state/token/hook'
type Props = {
  whiteListFilterPools: TokenFromPoolGroup[],
  poolGroupsValue?: PoolGroupValueType
  handlePoolSelect: (pool: TokenFromPoolGroup, hasWarning?: boolean) => void
  isLoading: boolean
}
export const ListCurrencies = ({ whiteListFilterPools, isLoading = false, handlePoolSelect }: Props) => {
  const { getTokenValue } = useTokenValue({})
  const { tokens } = useListTokens()
  return (
    <div className='token-list'>
      <table className='token-list-table' style={{
      }}>
        {whiteListFilterPools.length > 0 && (
          <tr className='table-head'>
            <th />
            <th />
          </tr>
        )}
        {whiteListFilterPools.map((index, _) => {
          return index.poolGroup.map((pool, __) => {
            const poolValue = NUM(getTokenValue(
              pool?.TOKEN_R,
              IEW(pool?.states?.R, tokens[pool?.TOKEN_R]?.decimals),
              true
            ))
            const poolValueR = NUM(IEW(pool?.states?.R, tokens[pool?.TOKEN_R]?.decimals))
            return (
              <tr
                key={_ + __}
                className='position-token-list'
                onClick={() => handlePoolSelect({
                  baseToken: index.baseToken,
                  quoteToken: index.baseToken,
                  poolGroup: [pool]
                })}
              >
                <td className='token-item'>
                  <span className='chart-token-selector--current inline-items-center'>
                    <CurrencyGroupLogo currencyURIs={[index.baseToken.logoURI, index.quoteToken.logoURI]} size={36}/>
                    <div className='chart-token-symbol'>
                      <Text>
                        {index.baseToken.symbol} / {index.quoteToken.symbol}
                      </Text><br/>
                      <TextGrey>  {pool?.timeStamp ? moment
                        .unix(pool?.timeStamp)
                        .fromNow()
                        .toLocaleLowerCase() : ''} </TextGrey>
                    </div>

                  </span>
                  <span className='inline-items-center' />
                </td>

                <td className='index-value-item'>
                  {poolValueR > 0
                    ? <TextGrey>{`${zerofy(poolValueR)} ${unwrap(tokens[pool?.TOKEN_R].symbol)}`}<br/></TextGrey>
                    : <SkeletonLoader textLoading='   ' loading/>}

                  {poolValue > 0
                    ? <TextGrey>{`$${formatLocalisedCompactNumber(formatFloat(poolValue))}` }</TextGrey>
                    : <SkeletonLoader textLoading='   ' loading/>}
                </td>

              </tr>
            )
          })
        })}
      </table>
      {isLoading && Array(8).fill(0).map((a, _) => <SkeletonLoader height='50px' key={_} loading style={{ width: '100%', marginTop: '1rem' }}/>)}
      <div className='search-model-footer'><TextGrey>Enter to search more</TextGrey></div>
    </div>
  )
}
