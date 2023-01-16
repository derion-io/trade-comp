import React, { useMemo, useState } from 'react'
import './style.scss'
import { Text, TextBuy, TextGreen, TextLink, TextPink, TextSell } from '../../ui/Text'
import { bn, formatFloat, numberToWei, parseUq112x112, weiToNumber } from '../../../utils/helpers'
import { PoolType } from '../../../state/pools/type'
import { useListTokens } from '../../../state/token/hook'
import { TokenSymbol } from '../../ui/TokenSymbol'
import { useConfigs } from '../../../state/config/useConfigs'
import { ButtonExecute } from '../../ui/Button'
import { PowerState } from 'powerLib'
import isEqual from 'react-fast-compare'

export const SECONDS_PER_YEAR = 31536000
export const SECONDS_PER_DAY = 86400

const Component = ({ visible, pool }: {
  visible: boolean,
  pool: PoolType
}) => {
  const { configs, ddlEngine } = useConfigs()
  const { tokens } = useListTokens()
  const { states, powers, dTokens, baseToken, quoteToken, poolAddress } = pool
  const { Rc, rDcLong, rDcShort, totalSupplies } = states || {}
  const [deleverageLoading, setDeleverageLoading] = useState(false)

  const [totalLockedValue, rDcLongValue, rDcShortValue, collateralRatio] = useMemo(() => {
    if (!states) return [bn(0), bn(0), bn(0), 0]
    const unit = 100000
    const cPrice = bn(states?.twapLP || 0).mul(unit).shr(112)
    const rDc = rDcLong.add(rDcShort)
    const collateralRatio = rDc.gt(0) ? Rc.mul(unit).div(rDc).toNumber() / unit : 0

    return [Rc.mul(cPrice).div(unit), rDcLong.mul(cPrice).div(unit), rDcShort.mul(cPrice).div(unit), collateralRatio]
  }, [pool])

  const isDeleverage = useMemo(() => {
    if (!states) return false
    const rDc = rDcLong.add(rDcShort)
    const deleverageRate = pool?.deleverageRate ? parseUq112x112(pool.deleverageRate) : bn(1)
    const cr = rDc.gt(0) ? Rc.mul(numberToWei(1)).div(rDc) : bn(0)
    const rate = bn(numberToWei(1, 36)).div(numberToWei(deleverageRate, 18))
    return cr.gt(0) && cr.lt(rate)
  }, [pool])

  const powerState = useMemo(() => {
    if (powers && states) {
      const p = new PowerState({ powers })
      p.loadStates(states)
      return p
    }
    return null
  }, [pool])

  return <div className='pool-expand__wrap'>
    <div className='pool-expand'>
      <div className='pool-expand__top'>
        <div className='pool-expand__top--left'>
          <p className='pool-expand__top--left-head'><TextPink> </TextPink></p>
          <div className='pool-expand__top--left-content'>
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
                    // @ts-ignore
                    await ddlEngine.SWAP.multiSwap([], true)
                    setDeleverageLoading(false)
                  }}
                >{deleverageLoading ? 'Loading...' : 'Deleverage'}</ButtonExecute>
              </div>
            }
          </div>
        </div>
        <div className='pool-expand__top--mid'>
          <p className='pool-expand__top--mid-head'><TextPink>Derivatives</TextPink></p>
          <div className='pool-expand__top--mid-content'>
            {
              powers && powers
                .map((power: number, index: number) => {
                  return { power, index }
                })
                .sort((a: any, b: any) => b.power - a.power)
                .map(({ power, index }: { power: number, index: number }) => {
                  const price = powerState ? powerState.calculatePrice(power) : 0
                  if (price == 0 || !Number.isFinite(price)) {
                    return { index, power, value: 0 }
                  }
                  const value = totalSupplies[index]?.mul(numberToWei(price || 0))
                  return { index, power, value }
                })
                .filter(({ value }: { value: number }) => {
                  return value > 0
                })
                .map(({ index, power, value }: { index: number, power: number, value: number }) => {
                  const TextComp = power > 0 ? TextBuy : TextSell
                  return <div key={index}>
                    <Text><TextGreen>${formatFloat(weiToNumber(value, 36), 2)}</TextGreen> </Text>
                    <TextComp>
                      <TokenSymbol token={tokens[dTokens[index]]} />
                    </TextComp>
                  </div>
                })
            }
          </div>
        </div>
        <div className='pool-expand__top--right'>
          <p className='pool-expand__top--right-head'><TextPink>States</TextPink></p>
          <div className='pool-expand__top--right-content'>
            <div>
              <Text>Total Locked Value:</Text><TextGreen> ${formatFloat(weiToNumber(totalLockedValue), 2)}</TextGreen>
            </div>
            <div>
              <Text>Collateral Ratio:</Text><TextGreen> {formatFloat(collateralRatio, 2)}</TextGreen>
            </div>
            <div>
              <Text>Long Derivatives Value:</Text><TextGreen> ${formatFloat(weiToNumber(rDcLongValue), 2)}</TextGreen>
            </div>
            <div>
              <Text>Short Derivatives Value:</Text><TextGreen> ${formatFloat(weiToNumber(rDcShortValue), 2)}</TextGreen>
            </div>
            <div>
              <Text>Long Funding Rate (daily): </Text>
              <TextGreen>{states?.rentRateLong && formatFloat(parseUq112x112(states.rentRateLong.mul(SECONDS_PER_DAY).mul(100)), 4)}%</TextGreen>
            </div>
            <div>
              <Text>Short Funding Rate (daily): </Text>
              <TextGreen>{states?.rentRateShort && formatFloat(parseUq112x112(states.rentRateShort.mul(SECONDS_PER_DAY).mul(100)), 4)}%</TextGreen>
            </div>
          </div>
        </div>
      </div>
      <div className='pool-expand__bottom'>
        <div className='pool-expand__bottom--content'>
          <div>
            <Text>Price Tolenrance Ratio: </Text>
            <TextGreen>{pool?.priceToleranceRatio && parseUq112x112(pool.priceToleranceRatio)}</TextGreen>
          </div>
          <div>
            <Text>Max Funding Rate (daily): </Text>
            <TextGreen>{pool?.rentRate && formatFloat(parseUq112x112(pool.rentRate.mul(SECONDS_PER_DAY).mul(100)), 4)}% </TextGreen>
          </div>
          <div>
            <Text>Deleverage Rate: </Text>
            <TextGreen>{pool?.deleverageRate && formatFloat(parseUq112x112(pool.deleverageRate) * 100, 2)}%</TextGreen>
          </div>
        </div>
      </div>
    </div>
  </div>
}

export const ExpandPool = React.memo(Component, (prevProps, nextProps) =>
  isEqual(prevProps, nextProps)
)
