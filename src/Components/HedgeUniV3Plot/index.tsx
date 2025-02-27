import React, { useEffect, useMemo, useState } from 'react'
import { Expression, GraphingCalculator } from 'desmos-react'
import './style.scss'
import { Card } from '../ui/Card'
import { useCurrentPool } from '../../state/currentPool/hooks/useCurrentPool'
import { formatFloat, zerofy, isUSD, WEI, IEW, calcPoolSide, div, NUM, calculatePx } from '../../utils/helpers'
import { CandleChartLoader } from '../ChartLoaders'
import { useListTokens } from '../../state/token/hook'
import { useHelper } from '../../state/config/useHelper'
import { POOL_IDS } from '../../utils/constant'
import { BigNumber } from 'ethers'
import {useConfigs} from '../../state/config/useConfigs'
import { Slider } from 'antd';
import {useUni3Position} from '../../state/uni3Positions/hooks/useUni3Positions'
import {useResource} from '../../state/resources/hooks/useResource'

const FX = 'f(P,x,v,R)=\\{2vx^P<R:vx^P,R-R^2/(4vx^P)\\}'
const GX = 'g(P,x,v,R)=\\{2vx^{-P}<R:R-vx^{-P},R^2/(4vx^{-P})\\}'

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

function xTop(X: number, xb: number, xa: number): number {
  const term1 = 1 / Math.sqrt(X);
  const term2 = 1 / (2 * Math.sqrt(xb));
  const term3 = Math.sqrt(xa) / (2 * X);

  const result = Math.pow(term1 + term2 - term3, -2);

  return result;
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
  const {currentDisplayUni3Position, uni3Positions} = useUni3Position()
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
    MARK,
    exp,
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
      MARK,
      exp,
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
  // const uniV3Data = useHedgeUniV3()
  // const [p, setP] = useState('5');
  // const [L, setL] = useState('1.105');
  // const [D, setD] = useState('0.726');

  // const hedgeData = useMemo(() => {
    // console.log(price)
    // const {
    //   tick,
    //   uni3PosData,
    //   token0Data,
    //   token1Data,
    // } = currentUni3Position
    // if (!uni3PosData || !tick || !token0Data || !token1Data) return;
    // if(!currentDisplayUni3Position) return;
    // const { tickLower, tickUpper, liquidity, fee, feeGrowthInside1LastX128, feeGrowthInside0LastX128 } = currentDisplayUni3Position
    // const diffDecimals = Math.abs(token0Data.decimals - token1Data.decimals)
    // const px = calculatePx(tick)
    // const pxa = calculatePx(tickLower)
    // const pxb = calculatePx(tickUpper)
    // console.log(currentDisplayUni3Position)
    // return {
    //   pxa,
    //   pxb
    // }
    // let a = pxa / px
    // let b = pxb / px
    // console.log('#lower, current, upper', pxa * (10 ** diffDecimals), px * (10 ** diffDecimals), pxb * (10 ** diffDecimals))
    // console.log('#a,b', a,b)
    // return {
    //   a,
    //   b,
    //   pxa: pxa * 10 ** diffDecimals,
    //   pxb: pxb * 10 ** diffDecimals,
    //   px: px * 10 ** diffDecimals
    // }
  // }, [currentDisplayUni3Position])
  const [yA, setyA] = useState<number>(0);
  const [yB, setyB] = useState<number>(0);
  const [yTop, setYTop] = useState<number>(0);
  
  const hedgeData = useMemo(() => {
    if(!currentDisplayUni3Position || !mark) return;
    const pxa = NUM(currentDisplayUni3Position?.pxLower / mark)
    const px = NUM(currentDisplayUni3Position?.px / mark)
    const pxb = NUM(currentDisplayUni3Position?.pxUpper / mark)
    return {
      pxa,
      px,
      pxb,
    }
  },[currentDisplayUni3Position, mark])

  useEffect(() => {
    if (hedgeData && calc.current) {
      const { px, pxa, pxb } = hedgeData
      const xT = xTop(px, pxb, pxa)
      const helpers = {
        top: calc.current.HelperExpression({ latex: `i(${xT})` }),
        a: calc.current.HelperExpression({ latex: `i(${pxa})` }),
        b: calc.current.HelperExpression({ latex: `i(${pxb})` })
      }

      helpers.a?.observe('numericValue', () => setyA(helpers.a.numericValue))
      helpers.b?.observe('numericValue', () => setyB(helpers.b.numericValue))
      helpers.top?.observe('numericValue', () =>
        setYTop(helpers.top.numericValue)
      )
    }
  }, [hedgeData, calc])

  useEffect(() => {
    if (!calc?.current || !hedgeData) {
      return
    }
    const { px, pxa, pxb } = hedgeData
    const xMax = Math.max(px, pxa, pxb)
    const xMin = Math.min(px, pxa, pxb)
    if (xMin >= xMax) {
      return
    }
    const yMax = Math.max(0, yTop, yA, yB, -yA, -yB)
    const yMin = Math.min(0, yTop, yA, yB)
    if (yMin >= yMax) {
      return
    }
    const bounds = {
      left: xMin - (xMax - xMin) * 1,
      right: xMax + (xMax - xMin) * 1,
      bottom: yMin - (yMax - yMin) * 1,
      top: yMax + (yMax - yMin) * 2,
    }
    calc.current.setMathBounds(bounds)
  }, [hedgeData, yA, yB, yTop])

  const {poolGroups} = useResource()

  const { isHasDerionIndex, isLoadingCurrentPoolState } = useMemo(() => {
    let _isHasDerionIndex = false;
    let _isLoadingCurrentPoolState = false;
  
    if (currentDisplayUni3Position) {
      const { token0, token1, token0Data, token1Data } = currentDisplayUni3Position;
      const posTokens = [token0, token1, token0Data.symbol, token1Data.symbol];
  
      const { baseToken, quoteToken } = currentPool;
      const baseTokenSymbol = tokens[baseToken]?.symbol || tokens[baseToken]?.name;
      const quoteTokenSymbol = tokens[quoteToken]?.symbol || tokens[quoteToken]?.name;
  
      _isHasDerionIndex = Object.values(poolGroups).some(({ baseToken, quoteToken }) => {
        const baseSymbol = tokens[baseToken]?.symbol || tokens[baseToken]?.name;
        const quoteSymbol = tokens[quoteToken]?.symbol || tokens[quoteToken]?.name;
        return (
          (posTokens.includes(baseToken) && posTokens.includes(quoteToken)) ||
          (posTokens.includes(baseSymbol) && posTokens.includes(quoteSymbol))
        );
      });
  
      if (_isHasDerionIndex) {
        _isLoadingCurrentPoolState =
          !(posTokens.includes(baseToken) && posTokens.includes(quoteToken)) &&
          !(posTokens.includes(baseTokenSymbol) && posTokens.includes(quoteTokenSymbol));
      }
    }
  
    return { isHasDerionIndex: _isHasDerionIndex, isLoadingCurrentPoolState: _isLoadingCurrentPoolState };
  }, [currentDisplayUni3Position, poolGroups, currentPool, tokens]);

  return (
    <React.Fragment>
      <Card className='p-1 plot-chart-box flex flex-col justify-center items-center pb-[80px] pt-[80px] gap-6'>
        {/* {JSON.stringify(hedgeData || {})} */}
      {/* <div className="controls"> */}
          {/* <label>
            p: {' '}
            <input value={p} onChange={(e) => setP(e.target.value)} />
          </label> */}
           {/* {' '} <label>
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
          </label> */}
        {/* </div> */}
        {isLoadingCurrentPoolState ? '' : 
        isHasDerionIndex ? 
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
          xAxisLabel={`${currentDisplayUni3Position?.token0Data.symbol} / ${currentDisplayUni3Position?.token1Data.symbol}`}
          yAxisLabel='Value'
        >
           {/* DERION */}
          {/* <Expression id='f' latex={FX} hidden />
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
          <Expression id='lA' latex={`(${AD}*1.1,${Math.min(R, R1)}/4)`} color='PURPLE' hidden showLabel label='LONG' labelOrientation={Desmos.LabelOrientations.DEFAULT} /> */}

          <Expression id='derion-a0' latex={`a_{0}=${a}`} />
          <Expression id='derion-b0' latex={`b_{0}=${b}`} />
          <Expression id='derion-r0' latex={`R_{0}=${R}`} />
          <Expression id='derion-r' latex={`X=${hedgeData?.px}`} />
          <Expression id='derion-K' latex={`K=${K}`} />
          <Expression id='common-r' latex={'r(k, x, v, R) = \\left\\{ v x^{k} \\le \\frac{R}{2} : v x^{k}, R - \\frac{R^{2}}{4 v x^{k}} \\right\\} \\{ 0 \\le x \\}'} />
          <Expression id='common-vr' latex={'v_{r}(k, x, r_{v}, R) = \\left\\{ \\frac{r_{v}}{x^{k}}, \\frac{R^{2}}{4(R - r_{v})x^{k}} \\right\\} \\quad \\text{for} \\quad r_{v} \\leq \\frac{R}{2}'} hidden />
          <Expression id='common-f(x)' latex={'f(x) = \\left\\{ a_{0}x^{K} \\leq \\frac{R_{0}}{2} : a_{0}x^{K}, R_{0} - \\frac{R_{0}^{2}}{4a_{0}x^{K}} \\right\\} \\quad \\left\\{ 0 < x \\right\\}'} hidden />

          {/* <Expression id='hedge-ix' latex={'i(x) = \\frac{2\\sqrt{x}}{1+x} - 1'} color={'GREEN'} lineStyle={'DASHED'} hidden={true} /> */}
          <Expression id='Hedge-xa' latex={`x_{a}=${hedgeData?.pxa}`} />
          <Expression id='Hedge-xb' latex={`x_{b}=${hedgeData?.pxb}`} />
          {/* <Expression id='IL-Vi' latex='V_{i}=-0.753' /> */}
          {/* <Expression id='IL-V' latex='V=-V_{i}R_{0}' /> */}
          <Expression id='IL-V' latex={`V=${currentDisplayUni3Position?.totalPositionByUSD}`} />

          <Expression id='Hedge-l-function' latex={'l(x) = \\frac{r(K,x,a_{0},R_{0})}{r(K,X,a_{0},R_{0})} - 1'} color="RED"  hidden/>
          <Expression id='Hedge-s-function' latex={'s(x) = \\frac{r(-K,x,b_{0},R_{0})}{r(-K,X,b_{0},R_{0})} - 1'} hidden color="BLUE" />
          <Expression id='Hedge-Ls-function' sliderBounds={{
            min:'x_{a}',
            max:'x_{b}',
            step: 0.000001,
          }} 
          latex={`L_{s} = ${((hedgeData?.pxa ?? 0) + (hedgeData?.pxb ?? 0)) / 2}`} />
          <Expression id='Hedge-Ds-function' sliderBounds={{min: '0' , max: 'V', step: 0.0001}} latex={`D_{s} = ${(yTop ?? 0) * 2}`} />
          <Expression id='Hedge-D-slider-function' latex={'D = \\frac{D_{s}}{\\left|u_{c}\\left(x_{b}\\right)\\right| - D_{s}}'} />
          <Expression id='Hedge-L-slider-function' latex={'L = 1 - \\frac{L_{s} - x_{a}}{x_{b} - x_{a}}'} />
          <Expression id='Hedge-544' latex={'(L_{s}, D_{s})'} showLabel label='H' pointOpacity={2} pointSize={20} />
          <Expression id='Hedge-H-function' latex={'H(x) = \\frac{D}{V} \\left( l(x) L + s(x) (1 - L) \\right)'} color="#E74C3C" lineStyle='DASHED' hidden lineWidth={1} />
          <Expression id='Hedge-iH-function' latex={'i_{H}(x) = i(x) + H(x)'} color="#E74C3C" />

          {/* <Expression id='IL-V-function' latex={'\\left(\\sqrt{x_{a}x_{b}},V_{i}\\right)'} color={'RED'} showLabel={true} label='V' /> */}
          <Expression id='IL-A-function' latex={'\\left(x_{a},i\\left(x_{a}\\right)\\right)'} dragMode={'NONE'} color={'#34495E'} showLabel={true} label='A' />
          <Expression id='IL-B-function' latex={'\\left(x_{b},i\\left(x_{b}\\right)\\right)'} dragMode={'NONE'} color={'#34495E'} showLabel={true} label='B' />
          <Expression id='IL-X-function' latex={'\\left(X,i\\left(X\\right)\\right)'} color={'#34495E'} dragMode={'NONE'} showLabel={true} label='X' />
          <Expression id='IL-iHxa-function' latex={'\\left(x_{a},i_{H}\\left(x_{a}\\right)\\right)'} dragMode={'NONE'} />
          <Expression id='IL-iHxb-function' latex={'\\left(x_{b},i_{H}\\left(x_{b}\\right)\\right)'} dragMode={'NONE'} />
          <Expression id='IL-iH-line-function' latex={'i_{H}\\left(x_{a}\\right)-s_{iH}x_{a}+s_{iH}x \\{x_{a}<x<x_{b}\\}'} color={'#34495E'} lineStyle='DASHED'/>
          <Expression id='IL-siH-function' latex={'s_{iH}=\\frac{\\left(i_{H}\\left(x_{b}\\right)-i_{H}\\left(x_{a}\\right)\\right)}{x_{b}-x_{a}}'} />
          <Expression id='IL-ka-function' latex={'k_{a}=\\frac{V}{2\\sqrt{X}}'}/>
          <Expression id='IL-mQ-function' latex={'m_{Q}=k_{a}\\left(\\sqrt{x_{b}}-\\sqrt{x_{a}}\\right)'} />
          <Expression id='IL-mB-function' latex={'m_{B}=\\frac{m_{Q}}{\\sqrt{x_{a}x_{b}}}'} />
          <Expression id='IL-ucx-function' latex={'u_{c}\\left(x\\right)=k_{a}\\left(2\\sqrt{x}-\\frac{x}{\\sqrt{x_{b}}}-\\sqrt{x_{a}}\\right)'} color={'RED'} hidden />
          <Expression id='IL-mx-function' latex={'m\\left(x\\right)=\\frac{V}{\\left\\{x<x_{a}:xm_{B},x_{b}<x:m_{Q},u_{c}\\left(x\\right)\\right\\}}'} color={'ORANGE'} hidden />
          <Expression id='IL-ux-function' latex={'u\\left(x\\right)=m\\left(X\\right)\\left\\{x<x_{a}:xm_{B},x_{b}<x:m_{Q},u_{c}\\left(x\\right)\\right\\}\\left\\{x>0\\right\\}'} color={'BLUE'} hidden/>
          <Expression id='IL-vx-function' latex={'v_{0}(x)=\\frac{V}{2}(\\frac{x}{X}+1) \\{x>0\\}'} lineStyle='DASHED' color="#6042a6" lineWidth='1' hidden />
          <Expression id='IL-ix-function' latex={'i\\left(x\\right)=u\\left(x\\right)-v_{0}\\left(x\\right)'} color={'#34495E'} lineStyle='DASHED' />

        </GraphingCalculator> :
         ((!currentDisplayUni3Position?.token0Data.symbol || !currentDisplayUni3Position?.token1Data.symbol) ? '' : ` No Derion Pool for ${currentDisplayUni3Position?.token0Data.symbol}/${currentDisplayUni3Position?.token1Data.symbol}` )}
      </Card>
    </React.Fragment>
  )
}
