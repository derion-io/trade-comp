import React, { useMemo } from 'react'
import './style.scss'
import { Text, TextBlue, TextBuy, TextGreen, TextLink, TextPink, TextSell } from '../../ui/Text'
import { bn, formatFloat, numberToWei, parseUq112x112, weiToNumber } from '../../../utils/helpers'
import { PoolType } from '../../../state/pools/type'
import { useListTokens } from '../../../state/token/hook'
import { TokenSymbol } from '../../ui/TokenSymbol'

export const ExpandPool = ({ visible, pool }: {
  visible: boolean,
  pool: PoolType
}) => {
  const { tokens } = useListTokens()
  const { states, baseToken, powers } = pool
  const { Rc, rDcLong, rDcShort, totalSupplies } = states

  const [totalLockedValue, rDcLongValue, rDcShortValue, collateralRatio] = useMemo(() => {
    const unit = 100000
    const cPrice = bn(states.twapLP).mul(unit).shr(112)
    const rDc = rDcLong.add(rDcShort)
    const collateralRatio = Rc.mul(unit).div(rDc).toNumber() / unit * 100

    return [rDc.mul(cPrice).div(unit), rDcLong.mul(cPrice).div(unit), rDcShort.mul(cPrice).div(unit), collateralRatio]
  }, [])

  return <div className='pool-expand__wrap'>
    <div className='pool-expand'>
      <div className='pool-expand__top'>
        <div className='pool-expand__top--left'>
          <p className='mb-1'><TextPink>Get ETH-USDT LP</TextPink></p>
          <p className='mb-1'><TextLink>View Contract</TextLink></p>
        </div>

        <div className='pool-expand__top--mid'>
          <p className='mb-1'><TextPink>Total supplies</TextPink></p>
          {
            powers.map((power, key) => {
              const TextComp = power > 0 ? TextBuy : TextSell
              return <div key={key}><TextComp>
                <TokenSymbol token={tokens[baseToken]} />: {formatFloat(weiToNumber(totalSupplies[key]), 2)}
              </TextComp>
              </div>
            })
          }
        </div>
        <div className='pool-expand__top--right'>
          <p className='mb-1'><TextPink>States</TextPink></p>
          <div><Text>Locked value:</Text><TextGreen> {formatFloat(weiToNumber(totalLockedValue), 2)}</TextGreen></div>
          <div><Text>Long derivative value:</Text><TextGreen> {formatFloat(weiToNumber(rDcLongValue), 2)}</TextGreen>
          </div>
          <div><Text>Short derivative value:</Text><TextGreen> {formatFloat(weiToNumber(rDcShortValue), 2)}</TextGreen></div>
          <div><Text>Collateral ratio :</Text><TextGreen> {formatFloat(collateralRatio, 2)}%</TextGreen></div>
        </div>
      </div>
      <div className='pool-expand__box'>
        <div className='pool-expand__box--title'>Configs</div>
        <div className='pool-expand__configs'>
          <div>
            <Text>Price Tolenrance Ratio: </Text><TextGreen> {parseUq112x112(pool.priceToleranceRatio)}</TextGreen>
          </div>
          <div>
            <Text>Funding rate: </Text><TextGreen>{parseUq112x112(pool.rentRate)}</TextGreen>
          </div>
          <div>
            <Text>Deleverage Rate: </Text><TextGreen>{formatFloat(parseUq112x112(pool.deleverageRate) * 100, 2)}%</TextGreen>
          </div>
        </div>
      </div>
    </div>
  </div>
}
