import React, { useEffect, useMemo, useState } from 'react'
import { Expression, GraphingCalculator } from 'desmos-react'
import './style.scss'
import { Card } from '../ui/Card'
import { useCurrentPool } from '../../state/currentPool/hooks/useCurrentPool'
import { formatFloat, zerofy, isUSD, WEI, IEW, calcPoolSide, div, NUM } from '../../utils/helpers'
import { CandleChartLoader } from '../ChartLoaders'
import { useListTokens } from '../../state/token/hook'
import { useHelper } from '../../state/config/useHelper'
import { POOL_IDS } from '../../utils/constant'
import { BigNumber } from 'ethers'
import {useConfigs} from '../../state/config/useConfigs'
import {useHedgeUniV3} from '../HedgeUniV3Plot-old/hook/useUniV3'
import { Slider } from 'antd';

const FX = 'f(P,x,v,R)=\\{2vx^P<R:vx^P,R-R^2/(4vx^P)\\}'
const GX = 'g(P,x,v,R)=\\{2vx^{-P}<R:R-vx^{-P},R^2/(4vx^{-P})\\}'
const calculatePx = (tick: number) => {
  return Math.pow(1.0001, tick);
}
function _r(xk: number, v: number, R: number): number {
  const r = v * xk
  if (r <= R / 2) {
    return r
  }
  const denominator = v * xk * 4
  const minuend = (R * R) / denominator
  return R - minuend
}

function _v(xk: number, r: number, R: number): number {
  if (r <= R / 2) {
    return r / xk
  }
  const denominator = (R - r) * xk * 4
  return (R * R) / denominator
}

function _x(k: number, r: number, v: number): number {
  return Math.pow(r / v, 1 / k)
}

// function _k(k: number, x: number, v: number, R: number): number {
//   return (k * R) / Math.abs(4 * v * x ** k - R)
// }

function pX(x: number, mark: number): string {
  return zerofy(x * mark)
}

export const HedgeUniV3Plot = (props: any) => {
  const { tokens } = useListTokens()
  const cp = useCurrentPool()
  const { currentPool } = cp
  const { wrapToNativeAddress } = useHelper()
  const calc = React.useRef() as React.MutableRefObject<Desmos.Calculator>

  const {
    PX,
    a,
    b,
    priceIndex,
    R,
    P,
    K,
    X,
    mark,
    R1,
    a1,
    b1,
    drAChange,
    drBChange,
    AD,
    BD
  } = useMemo(() => {
    const { baseToken, quoteToken, states, MARK, TOKEN_R, k } = currentPool ?? {}
    const {
      exp,
      mark,
      leverage: P
    } = calcPoolSide(currentPool, POOL_IDS.C, tokens)

    const normalize = (as: BigNumber[]): number[] => {
      const ls = as.map(b => b.toString().length)
      const maxL = Math.max(...ls)
      const minL = Math.min(...ls)
      const avgL = (maxL + minL) >> 1
      return as.map(a => formatFloat(IEW(a, avgL)))
    }

    const [R, a, b, drA, drB, drC] = normalize([
      states.R,
      states.a,
      states.b,
      WEI(cp.drA, tokens[TOKEN_R].decimals),
      WEI(cp.drB, tokens[TOKEN_R].decimals),
      WEI(cp.drC, tokens[TOKEN_R].decimals),
    ])

    const x = !states?.spot || !MARK ? 1 : NUM(div(states?.spot, MARK))
    const X = x**exp

    let priceIndex = tokens[wrapToNativeAddress(baseToken)]?.symbol
    if (!isUSD(tokens[quoteToken]?.symbol)) {
      priceIndex += '/' + tokens[wrapToNativeAddress(quoteToken)]?.symbol
    }
    const PX = X * 0.01
    const R1 = R + drA + drB + drC

    const xk = X ** P
    const rA = _r(xk, a, R)
    const rB = _r(1 / xk, b, R)
    const rA1 = rA + drA
    const rB1 = rB + drB
    const a1 = _v(xk, rA1, R1)
    const b1 = _v(1 / xk, rB1, R1)

    const drAChange =
      rA1 !== rA
        ? `x=${X}\\{${Math.min(rA, rA1)}<y<${Math.max(rA, rA1)}\\}`
        : null
    const drBChange =
      R1 - rB1 !== R - rB
        ? `x=${X}\\{${Math.min(R - rB, R1 - rB1)}<y<${Math.max(
            R - rB,
            R1 - rB1
          )}\\}`
        : null

    const AD = _x(P, R1 / 2, a1)
    const BD = _x(-P, R1 / 2, b1)

    return {
      PX,
      a,
      //  0.776,
      b,
      // 0.36,
      priceIndex,
      R,
      // : 3,
      P,
      X,
      // : 0.94,
      mark,
      R1,
      // : 3,
      a1,
      // : 0.776,
      b1,
      // : 0.36,
      K: currentPool.K,
      drAChange,
      drBChange,
      AD,
      BD
    }
  }, [cp])

  React.useEffect(() => {
    if (calc && calc.current) {
      const TM = Math.max(R, R1)
      const RM = Math.max(AD, X)
      calc.current.setMathBounds({
        bottom: -0.05 * TM,
        top: 1.05 * TM,
        left: -0.03 * RM,
        right: 1.2 * RM,
      })
    }
  }, [calc, R, R1, X, AD])

  if (!currentPool.states) {
    return (
      <Card className='p-1'>
        <CandleChartLoader />
      </Card>
    )
  }

  const { configs } = useConfigs()
  const dollar = useMemo(() => {
    if (!currentPool) {
      return ''
    }
    const { quoteToken } = currentPool
    if(configs.stablecoins.includes(quoteToken)) {
      return '$'
    }
    return ''
  }, [currentPool])
  const uniV3Data = useHedgeUniV3()
  // const [p, setP] = useState('5');
  const [L, setL] = useState('0.00005');
  const [D, setD] = useState('0.00005');

  const hedgeData = useMemo(() => {
    const {
      tick,
      uni3PosData,
      token0Data,
      token1Data,
    } = uniV3Data
    if (!uni3PosData || !tick || !token0Data || !token1Data) return;
    const { tickLower, tickUpper } = uni3PosData
    const diffDecimals = Math.abs(token0Data.decimals - token1Data.decimals)
    const px = calculatePx(tick)
    const pxa = calculatePx(tickLower)
    const pxb = calculatePx(tickUpper)
    let a = pxa / px
    let b = pxb / px
    console.log('#lower, current, upper', pxa * (10 ** diffDecimals), px * (10 ** diffDecimals), pxb * (10 ** diffDecimals))
    console.log('#a,b', a,b)
    return {
      a,
      b,
      pxa: pxa * 10 ** diffDecimals,
      pxb: pxb * 10 ** diffDecimals,
      px: px * 10 ** diffDecimals
    }
  }, [uniV3Data])
  
  return (
    <React.Fragment>
      <Card className='p-1 plot-chart-box flex flex-col justify-center items-center pb-[80px] pt-[80px] gap-6'>
      <div className="controls">
          {/* <label>
            p: {' '}
            <input value={p} onChange={(e) => setP(e.target.value)} />
          </label> */}
           {' '} <label>
            L:  <input value={L} onChange={(e) => setL(String(e.target.value))} /> {' '}
              <Slider
                min={0}
                max={0.0001}
                step={0.000001}
                value={Number(L)}
                onChange={(value: number) => setL(String(value))}
                style={{ width: 300, margin: '10px 0' }}
              />
              
                </label>
                {' '} <label>
                  D: <input value={D} onChange={(e) => setD(String(e.target.value))} /> {' '} {' '}
                  <Slider
                min={0}
                max={0.0001}
                step={0.000001}
                value={Number(D)}
                onChange={(value: number) => setD(String(value))}
                style={{ width: 300, margin: '10px 0' }}
              />
          </label>
        </div>
        <GraphingCalculator
          attributes={{ className: 'calculator' }}
          fontSize={14}
          keypad
          projectorMode={false}
          settingsMenu={false}
          expressionsCollapsed
          expressions={false}
          zoomButtons={false}
          lockViewport={false}
          invertedColors
          border={false}
          showGrid={false}
          xAxisNumbers={false}
          yAxisNumbers={false}
          ref={calc}
          xAxisArrowMode='POSITIVE'
          yAxisArrowMode='POSITIVE'
          xAxisLabel={priceIndex}
          yAxisLabel='Value'
        >
           {/* DERION */}
          <Expression id='f' latex={FX} hidden />
          <Expression id='g' latex={GX} hidden />
          <Expression id='lR' latex={`(${X * 0.01},${R * 0.97})`} color='RED' hidden showLabel label='Pool Reserve' labelOrientation={Desmos.LabelOrientations.RIGHT} />
          <Expression id='R' latex={`y=${R}\\{${PX}<x\\}`} color='RED' lineWidth={1.5} />
          <Expression id='R1' latex={`y=${R1}\\{${PX}<x\\}`} color='RED' hidden={R === R1} lineWidth={1.5} lineStyle='DASHED' />
          <Expression id='short' latex={`g(${P},x,${b},${R})\\{${PX}<x\\}`} color='GREEN' />
          <Expression id='long' latex={`f(${P},x,${a},${R})\\{${PX}<x\\}`} color='PURPLE' />
          <Expression id='short1' latex={`g(${P},x,${b1},${R1})\\{${PX}<x\\}`} color='GREEN' lineStyle='DASHED' hidden={!drBChange && R1 === R} />
          <Expression id='long1' latex={`f(${P},x,${a1},${R1})\\{${PX}<x\\}`} color='PURPLE' lineStyle='DASHED' hidden={!drAChange && R1 === R} />
          <Expression id='Price' latex={`(${X},0)`} color='BLACK' hidden showLabel label={`${dollar}${pX(X, mark)}`} labelOrientation={Desmos.LabelOrientations.BELOW} />
          <Expression id='AD' latex={`(${AD},${R1 / 2})`} color='PURPLE' pointSize={20} pointOpacity={0.5} showLabel label={`${dollar}${pX(AD, mark)}`} labelOrientation={Desmos.LabelOrientations.RIGHT} />
          <Expression id='BD' latex={`(${BD},${R1 / 2})`} color='GREEN' pointSize={20} pointOpacity={0.5} showLabel label={`${dollar}${pX(BD, mark)}`} labelOrientation={Desmos.LabelOrientations.LEFT} />
          <Expression id='S' latex={`(${X},g(${P},${X},${b},${R}))`} color='GREEN' />
          <Expression id='L' latex={`(${X},f(${P},${X},${a},${R}))`} color='PURPLE' />
          <Expression id='S1' latex={`(${X},g(${P},${X},${b1},${R1}))`} color='GREEN' hidden={drBChange == null} />
          <Expression id='L1' latex={`(${X},f(${P},${X},${a1},${R1}))`} color='PURPLE' hidden={drAChange == null} />
          <Expression id='lC' latex={`(${AD+BD}/2,${Math.min(R, R1)}/2)`} color='BLACK' hidden showLabel label='LP' labelOrientation={Desmos.LabelOrientations.DEFAULT} />
          <Expression id='lB' latex={`(${BD}/2,${Math.max(R, R1)}*3/4)`} color='GREEN' hidden showLabel label='SHORT' labelOrientation={Desmos.LabelOrientations.DEFAULT} />
          <Expression id='lA' latex={`(${AD}*1.1,${Math.min(R, R1)}/4)`} color='PURPLE' hidden showLabel label='LONG' labelOrientation={Desmos.LabelOrientations.DEFAULT} />

          <Expression id='derion-a0' latex={`a_{0}=${a}`} />
          <Expression id='derion-b0' latex={`b_{0}=${b}`} />
          <Expression id='derion-r0' latex={`R_{0}=${R}`} />
          <Expression id='derion-r' latex={`X=${X}`} />
          <Expression id='derion-K' latex={`K=${K}`} />

          <Expression id='common-r' latex={'r(k, x, v, R) = \\left\\{ v x^{k} \\le \\frac{R}{2} : v x^{k}, R - \\frac{R^{2}}{4 v x^{k}} \\right\\} \\{ 0 \\le x \\}'} />

          <Expression id='hedge-ix' latex={'i(x) = \\frac{2\\sqrt{x}}{1+x} - 1'} color={'GREEN'} lineStyle={'DASHED'} hidden={true} />
          <Expression id='hedge-xa' latex={'x_{a}=0.8'} />
          <Expression id='hedge-xb' latex={'x_{b}=1.2'} />
          <Expression id='hedge-c(x)' latex={'c(x) = \\frac{1}{1 - \\frac{( \\sqrt{x_a} + x \\sqrt{\\frac{1}{x_b}})}{1 + x}}'} hidden={true} />
          <Expression id='hedge-i_c(x)' latex={'i_{c}(x)=i(x)c(x)'} hidden={true} color={'ORANGE'} lineStyle={'DASHED'} />
          <Expression id='hedge-i_a(x)' latex={'i_{a}(x)=i_{c}(x_{a})+1-\\frac{x_{a}}{x}'} hidden={true} color={'BLACK'} lineStyle={'DASHED'} />
          <Expression id='hedge-i_b(x)' latex={'i_{b}(x)=i_{c}(x_{b})'} hidden={true} />
          <Expression id='hedge-i_3(x)' latex={'i_{3}(x) = \\left\\{x < x_{a}: i_{a}(x), x > x_{b}: i_{b}(x), i_{c}(x)\\right\\}'} hidden={true} color={'ORANGE'} />

          <Expression id='hedge-l(x)' latex={'l(x) = \\frac{r(K, x, a_{0}, R_{0})}{r(K, X, a_{0}, R_{0})} - 1'} color={'ORANGE'} hidden={true} />
          <Expression id='hedge-s(x)' latex={'s(x) = \\frac{r(-K, x, b_{0}, R_{0})}{r(-K, X, b_{0}, R_{0})} - 1'} color={'BLUE'} hidden={true} />

          <Expression id='hedge-L-slider' latex={`L=${L}`} />
          <Expression id='hedge-D-slider' latex={`D=${D}`} />
          <Expression id='hedge-H(x)' latex={'H(x) = \\frac{l(x) L + s(x) (1 - L)}{D}'} color={'RED'} lineStyle='DASHED' />

        </GraphingCalculator>
      </Card>
    </React.Fragment>
  )
}
