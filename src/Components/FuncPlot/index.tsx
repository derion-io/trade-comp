import React, { useMemo } from 'react'
import { Expression, GraphingCalculator } from 'desmos-react'
import './style.scss'
import { Card } from '../ui/Card'
import { useCurrentPool } from '../../state/currentPool/hooks/useCurrentPool'
import { bn, formatFloat, isUSD, weiToNumber } from '../../utils/helpers'
import { CandleChartLoader } from '../ChartLoaders'
import { useListTokens } from '../../state/token/hook'
import { useHelper } from '../../state/config/useHelper'

const FX = 'f(P,x,v,R)=\\{vx^P<R/2:vx^P,R-R^2/(4vx^P)\\}'
const GX = 'g(P,x,v,R)=\\{vx^{-P}<R/2:R-vx^{-P},R^2/(4vx^{-P})\\}'

function _r(xk: number, v: number, R: number): number {
  const r = v * xk
  if (r <= R/2) {
    return r
  }
  const denominator = v * xk  * 4
  const minuend = R*R / denominator
  return R - minuend
}

function _v(xk: number, r: number, R: number): number {
  if (r <= R/2) {
    return r / xk
  }
  const denominator = (R-r) * xk * 4
  return R*R / denominator
}

function _x(k: number, r: number, v: number): number {
  return (r/v)^(1/k)
}

function _k(k: number, x: number, v: number, R: number): number {
  return k*R/Math.abs(4*v*(x**k)-R)
}

export const FunctionPlot = (props: any) => {
  const { tokens } = useListTokens()
  const { currentPool, drA, drB, drC } = useCurrentPool()
  const { wrapToNativeAddress } = useHelper()
  const calc = React.useRef() as React.MutableRefObject<Desmos.Calculator>

  const { PX, a, b, priceIndex, R, P, X, mark, R1, a1, b1, drAChange, drBChange } = useMemo(() => {
    const { k, baseToken, quoteToken, states, MARK } = currentPool ?? {}
    const decimalsOffset = (tokens[baseToken]?.decimal ?? 18) - (tokens[quoteToken]?.decimal ?? 18)
    const K = k.toNumber()
    const P = K/2
    const R = formatFloat(weiToNumber(states?.R))
    const a = formatFloat(weiToNumber(states?.a))
    const b = formatFloat(weiToNumber(states?.b))
    const mark = MARK ? MARK.mul(MARK).mul((bn(10).pow(decimalsOffset))).shr(256) : 1
    const x = (!states?.spot || !MARK) ? 1 :
      bn(states?.spot).mul(1000).div(MARK).toNumber() / 1000
    const X = x*x

    let priceIndex = tokens[wrapToNativeAddress(baseToken)]?.symbol
    if (!isUSD(tokens[quoteToken]?.symbol)) {
      priceIndex += '/' + tokens[wrapToNativeAddress(quoteToken)]?.symbol
    }
    const PX = X * 0.01
    const R1 = R + drA + drB + drC

    const xk = x**K
    const rA = _r(xk, a, R)
    const rB = _r(1/xk, b, R)
    const rA1 = rA + drA
    const rB1 = rB + drB
    const a1 = _v(xk, rA1, R1)
    const b1 = _v(1/xk, rB1, R1)

    const drAChange = rA1 != rA ? `x=X\\{${Math.min(rA,rA1)}<y<${Math.max(rA,rA1)}\\}` : null
    const drBChange = (R1-rB1) != (R-rB) ? `x=X\\{${Math.min(R-rB,R1-rB1)}<y<${Math.max(R-rB,R1-rB1)}\\}` : null

    return { PX, a, b, priceIndex, R, P, X, mark, R1, a1, b1, drAChange, drBChange }
  }, [currentPool, drA, drB, drC])


  React.useEffect(() => {
    if (calc && calc.current) {
      calc.current.setMathBounds({
        bottom: -0.05 * Math.max(R, R1),
        top: Math.max(R, R1) * 1.05,
        left: -0.03 * X * 3,
        right: X * 3 * 1.03
      })
    }
  }, [calc, R, R1, X])

  if (!currentPool.states) {
    return <Card className='p-1'>
      <CandleChartLoader />
    </Card>
  }

  return (
    <React.Fragment>
      <Card className='p-1'>
        <div className='flex flex-col justify-center items-center pb-[80px] pt-[80px] gap-6'>
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
            <Expression id='f' latex={FX} hidden />
            <Expression id='g' latex={GX} hidden />
            <Expression
              id='lR'
              latex={`(${X * 0.01},${R * 0.97})`}
              color='RED'
              hidden
              showLabel
              label='Pool Reserve'
              labelOrientation={Desmos.LabelOrientations.RIGHT}
            />
            <Expression
              id='R'
              latex={`y=${R}\\{${PX}<x\\}`}
              color='RED'
              lineWidth={1.5}
            />
            <Expression
              id='R1'
              latex={`y=${R1}\\{${PX}<x\\}`}
              color='RED'
              hidden={R==R1}
              lineWidth={1.5}
              lineStyle='DASHED'
            />
            {/* <Expression
              id='rC'
              latex={`x=X\\{f(${P},X,${a},${R})<y<g(${P},X,${b},${R})\\}`}
              color='ORANGE'
              lineStyle='DASHED'
              lineWidth={1.5}
            /> */}
            <Expression id='short' latex={`g(${P},x,${b},${R})\\{${PX}<x\\}`} color='GREEN' />
            <Expression id='long' latex={`f(${P},x,${a},${R})\\{${PX}<x\\}`} color='PURPLE' />
            <Expression id='short1' latex={`g(${P},x,${b1},${R1})\\{${PX}<x\\}`} color='GREEN' lineStyle='DASHED' hidden={!drBChange&&R1==R} />
            <Expression id='long1' latex={`f(${P},x,${a1},${R1})\\{${PX}<x\\}`} color='PURPLE' lineStyle='DASHED' hidden={!drAChange&&R1==R} />
            <Expression
              id='X'
              latex={`X=${X}`}
              sliderBounds={{ min: X, max: X, step: '' }}
              // sliderBounds={{ min: PX, max: '', step: '' }}
            />
            <Expression
              id='p'
              latex={`p=\\operatorname{round}(X*${mark})`}
              hidden
            />
            <Expression
              id='Price'
              latex='(X,0)'
              color='BLACK'
              hidden
              showLabel
              label='$${p}'
              labelOrientation={Desmos.LabelOrientations.BELOW}
            />
            <Expression id='S' latex={`(X,g(${P},X,${b},${R}))`} color='GREEN' />
            <Expression id='L' latex={`(X,f(${P},X,${a},${R}))`} color='PURPLE' />
            <Expression id='S1' latex={`(X,g(${P},X,${b1},${R1}))`} color='GREEN' hidden={drBChange==null} />
            <Expression id='L1' latex={`(X,f(${P},X,${a1},${R1}))`} color='PURPLE' hidden={drAChange==null} />
            {/* <Expression
              id='rB'
              latex={`x=X\\{g(${P},X,${b},${R})<y<${R}\\}`}
              color='GREEN'
              lineStyle='DASHED'
              lineWidth={1.5}
            />
            <Expression
              id='rA'
              latex={`x=X\\{0<y<f(${P},X,${a},${R})\\}`}
              color='PURPLE'
              lineStyle='DASHED'
              lineWidth={1.5}
            /> */}
            <Expression
              id='drBChange'
              latex={drBChange!}
              color='GREEN'
              hidden={drBChange==null}
              lineWidth={3}
            />
            <Expression
              id='drAChange'
              latex={drAChange!}
              color='PURPLE'
              hidden={drAChange==null}
              lineWidth={3}
            />
            <Expression
              id='lC'
              latex={`(X,(1.1g(${P},X,${b},${R})+f(${P},X,${a},${R}))/2.1)`}
              color='BLACK'
              hidden
              showLabel
              label='LP'
              labelOrientation={Desmos.LabelOrientations.RIGHT}
            />
            <Expression
              id='lB'
              latex={`(X*0.9,(g(${P},X,${b},${R})+${R})/2)`}
              color='GREEN'
              hidden
              showLabel
              label='Short'
              labelOrientation={Desmos.LabelOrientations.LEFT}
            />
            <Expression
              id='lA'
              latex={`(X*1.1,0.55f(${P},X,${a},${R}))`}
              color='PURPLE'
              hidden
              showLabel
              label='Long'
              labelOrientation={Desmos.LabelOrientations.RIGHT}
            />
          </GraphingCalculator>
        </div>
      </Card>
    </React.Fragment>
  )
}
