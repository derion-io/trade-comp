import React, { useMemo, useState } from 'react'
import './style.scss'
import { Text, TextBlue, TextBuy, TextGreen, TextLink, TextPink, TextSell } from '../../ui/Text'
import { bn, formatFloat, numberToWei, parseUq112x112, weiToNumber } from '../../../utils/helpers'
import { PoolType } from '../../../state/pools/type'
import { useListTokens } from '../../../state/token/hook'
import { TokenSymbol } from '../../ui/TokenSymbol'
import { useConfigs } from '../../../state/config/useConfigs'
import { ButtonExecute } from '../../ui/Button'
import { PowerState } from 'powerLib'
import isEqual from 'react-fast-compare'
import { Divider } from '../../ui/Divider'

export const SECONDS_PER_YEAR = 31536000
export const SECONDS_PER_DAY = 86400

const Component = ({ visible, pool }: {
  visible: boolean,
  pool: PoolType
}) => {
  const { ddlEngine } = useConfigs()
  const { tokens } = useListTokens()
  const { states, powers, dTokens } = pool
  const { Rc, rDcLong, rDcShort, totalSupplies } = states || {}
  const [deleverageLoading, setDeleverageLoading] = useState(false)

  const [totalLockedValue, rDcLongValue, rDcShortValue, collateralRatio, imbalanceRate] = useMemo(() => {
    if (!states) return [bn(0), bn(0), bn(0), 0, 0]
    const unit = 100000
    const cPrice = bn(states?.twapLP || 0).mul(unit).shr(112)
    const rDc = rDcLong.add(rDcShort)
    const collateralRatio = rDc.gt(0) ? Rc.mul(unit).div(rDc).toNumber() / unit : 0

    const imbalanceRate = rDcShort && rDcLong
      ? bn(rDcLong).sub(rDcShort).mul(unit).div(rDcLong.add(rDcShort)).toNumber() / unit
      : 0

    return [
      Rc.mul(cPrice).div(unit),
      rDcLong.mul(cPrice).div(unit),
      rDcShort.mul(cPrice).div(unit),
      collateralRatio,
      Math.abs(imbalanceRate)
    ]
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

  const getPowerRows = (powersIsPositive: boolean) => {
    return powers && powers.map((power: number, index: number) => {
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
      .filter(({ power, value }) => {
        return (power > 0) === powersIsPositive && value > 0
      })
      .map(({ index, power, value }: { index: number, power: number, value: number }, key, arr) => {
        const TextComp = power > 0 ? TextBuy : TextSell
        const colspan = arr.length
        return <tr key={index} className='pool-expand__info-row'>
          <td className={`${key === 0 ? 'br-top-left' : ''} ${key === arr.length - 1 ? 'br-bottom-left' : ''}`}>
            <TextComp className='mr-2'>
              <TokenSymbol token={tokens[dTokens[index]]} />
            </TextComp>
            <TextBlue>${formatFloat(weiToNumber(value, 36), 2)}</TextBlue>
          </td>
          {
            key === 0 &&
            <td rowSpan={colspan} className='pool-expand__funding-rate--box'>
              <div className='pool-expand__funding-rate'>
                {powersIsPositive
                  ? <TextComp>
                    {states?.rentRateLong && formatFloat(parseUq112x112(states.rentRateLong.mul(SECONDS_PER_DAY).mul(100)), 4)}%
                  </TextComp>
                  : <TextComp>
                    {states?.rentRateShort && formatFloat(parseUq112x112(states.rentRateShort.mul(SECONDS_PER_DAY).mul(100)), 4)}%
                  </TextComp>
                }
              </div>
            </td>
          }
          {
            key === 0 &&
            <td rowSpan={colspan} className='br-top-right br-bottom-right'>
              {powersIsPositive
                ? <TextComp> ${formatFloat(weiToNumber(rDcLongValue), 2)} </TextComp>
                : <TextComp> ${formatFloat(weiToNumber(rDcShortValue), 2)} </TextComp>
              }
            </td>
          }
        </tr>
      })
  }

  return <div className='pool-expand'>
    <table className='pool-expand__table'>
      <thead>
        <tr>
          <th className='text-center'><Text>Derivatives</Text></th>
          <th className='text-center'>Funding Rate <TextBlue>(Daily)</TextBlue></th>
          <th className='text-center'><Text>TVL</Text> <TextBlue>${formatFloat(weiToNumber(totalLockedValue), 2)}</TextBlue></th>
        </tr>
      </thead>
      <tbody>
        {getPowerRows(true)}
        <tr>
          <td>
            <div className='space' />
          </td>
        </tr>
        {getPowerRows(false)}
        <tr>
          <td className='space' />
        </tr>
        <tr className='pool-expand__info-row pool-expand__imbalance-rate-row'>
          <td className='br-top-left br-bottom-left'>
            <Text>Imbalance Rate: </Text>
            <TextBlue>{formatFloat(imbalanceRate, 2)}%</TextBlue>
          </td>
          <td />
          <td className='br-top-right br-bottom-right'>
            <Text>Collateral Ratio: </Text>
            <TextBlue>{formatFloat(collateralRatio, 2)}</TextBlue>
          </td>
        </tr>
        <tr>
          <td colSpan={3}>
            {/* @ts-ignore */}
            <Divider title={<TextPink>Pool Configs</TextPink>} />
          </td>
        </tr>
        <tr className='pool-expand__info-row pool-expand__config-row'>
          <td className='br-top-left br-bottom-left p-1'>
            <Text>Price Tolerance Ratio: </Text>
            <TextGreen>{pool?.priceToleranceRatio && parseUq112x112(pool.priceToleranceRatio)}</TextGreen>
          </td>
          <td className='p-1'>
            <Text>Funding Rate: </Text>
            <TextGreen>{pool?.rentRate && formatFloat(parseUq112x112(pool.rentRate.mul(SECONDS_PER_DAY).mul(100)), 4)}% </TextGreen>
          </td>
          <td className='br-top-right br-bottom-right py-2'>
            <Text>Deleverage Rate: </Text>
            <TextGreen>{pool?.deleverageRate && formatFloat(parseUq112x112(pool.deleverageRate) * 100, 2)}%</TextGreen>
          </td>
        </tr>
        {
          isDeleverage &&
          <tr>
            <td colSpan={3} className='pt-1'>
              <ButtonExecute
                className='w-100'
                onClick={async () => {
                  setDeleverageLoading(true)
                  // @ts-ignore
                  await ddlEngine.SWAP.multiSwap([], true)
                  setDeleverageLoading(false)
                }}
              >{deleverageLoading ? 'Loading...' : 'Deleverage'}</ButtonExecute>
            </td>
          </tr>
        }
      </tbody>
    </table>
  </div>
}

export const ExpandPool = React.memo(Component, (prevProps, nextProps) =>
  isEqual(prevProps, nextProps)
)
