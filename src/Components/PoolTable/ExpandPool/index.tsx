import React, { useMemo, useState } from 'react'
import './style.scss'
import { Text, TextBlue, TextBuy, TextGreen, TextLink, TextPink, TextSell } from '../../ui/Text'
import { bn, formatFloat, numberToWei, parseUq112x112, weiToNumber } from '../../../utils/helpers'
import { PoolType } from '../../../state/pools/type'
import { useListTokens } from '../../../state/token/hook'
import { TokenSymbol } from '../../ui/TokenSymbol'
import { useConfigs } from '../../../state/config/useConfigs'
import { ButtonExecute } from '../../ui/Button'
import { useMultiSwapAction } from '../../../hooks/useMultiSwapAction'

export const SECONDS_PER_YEAR = 31536000

export const ExpandPool = ({ visible, pool, powerState }: {
  visible: boolean,
  pool: PoolType
  powerState: any
}) => {
  const { configs } = useConfigs()
  const { tokens } = useListTokens()
  const { states, powers, dTokens, baseToken, quoteToken, poolAddress } = pool
  const { Rc, rDcLong, rDcShort, totalSupplies } = states
  const [deleverageLoading, setDeleverageLoading] = useState(false)
  const { multiSwap } = useMultiSwapAction()

  const [totalLockedValue, rDcLongValue, rDcShortValue, collateralRatio] = useMemo(() => {
    const unit = 100000
    const cPrice = bn(states.twapLP).mul(unit).shr(112)
    const rDc = rDcLong.add(rDcShort)
    const collateralRatio = rDc.gt(0) ? Rc.mul(unit).div(rDc).toNumber() / unit : 0

    return [Rc.mul(cPrice).div(unit), rDcLong.mul(cPrice).div(unit), rDcShort.mul(cPrice).div(unit), collateralRatio]
  }, [])

  const isDeleverage = useMemo(() => {
    const rDc = rDcLong.add(rDcShort)
    const deleverageRate = parseUq112x112(pool.deleverageRate)
    const cr = rDc.gt(0) ? Rc.mul(numberToWei(1)).div(rDc) : bn(0)
    const rate = bn(numberToWei(1, 36)).div(numberToWei(deleverageRate, 18))
    return cr.gt(0) && cr.lt(rate)
  }, [])

  return <div className='pool-expand__wrap'>
    <div className='pool-expand'>
      <div className='pool-expand__top'>
        <div className='pool-expand__top--left'>
          <div className='mb-1'><TextLink
            href={`${configs.explorer}/address/${poolAddress}`}
          >DDL Pool Contract</TextLink></div>
          <div className='mb-1'><TextLink
            href={`https://pancakeswap.finance/add/${baseToken}/${quoteToken}`}
          >Get C-Token</TextLink></div>

          {
            isDeleverage && <div>
              <ButtonExecute
                onClick={async () => {
                  setDeleverageLoading(true)
                  await multiSwap([], true)
                  setDeleverageLoading(false)
                }}
              >{deleverageLoading ? 'Loading...' : 'Deleverage'}</ButtonExecute>
            </div>
          }
        </div>

        <div className='pool-expand__top--mid'>
          <p className='mb-1'><TextPink>Derivatives</TextPink></p>
          {
            powers.map((power, key) => {
              const TextComp = power > 0 ? TextBuy : TextSell
              const price = powerState.calculatePrice(power)
              const value = totalSupplies[key]?.mul(numberToWei(price || 0))
              return <div key={key}>
                <TextComp>
                  <TokenSymbol token={tokens[dTokens[key]]} />
                </TextComp>
                <Text> ${formatFloat(weiToNumber(value, 36), 2)}</Text>
              </div>
            })
          }
        </div>
        <div className='pool-expand__top--right'>
          <p className='mb-1'><TextPink>States</TextPink></p>
          <div><Text>Total Locked Value:</Text><TextGreen> ${formatFloat(weiToNumber(totalLockedValue), 2)}</TextGreen></div>
          <div><Text>Long Derivatives Value:</Text><TextGreen> ${formatFloat(weiToNumber(rDcLongValue), 2)}</TextGreen>
          </div>
          <div><Text>Short Derivatives Value:</Text><TextGreen> ${formatFloat(weiToNumber(rDcShortValue), 2)}</TextGreen>
          </div>
          <div><Text>Collateral Ratio:</Text><TextGreen> {formatFloat(collateralRatio, 2)}</TextGreen></div>
        </div>
      </div>
      <div className='pool-expand__box'>
        <div className='pool-expand__box--title'>Configs</div>
        <div className='pool-expand__configs'>
          <div>
            <Text>Price Tolenrance Ratio: </Text><TextGreen> {parseUq112x112(pool.priceToleranceRatio)}</TextGreen>
          </div>
          <div>
            <Text>Funding Rate (APR): </Text><TextGreen>{formatFloat(parseUq112x112(pool.rentRate.mul(SECONDS_PER_YEAR).mul(100)), 2)}%</TextGreen>
          </div>
          <div>
            <Text>Deleverage Rate: </Text><TextGreen>{formatFloat(parseUq112x112(pool.deleverageRate) * 100, 2)}%</TextGreen>
          </div>
        </div>
      </div>
    </div>
  </div>
}
