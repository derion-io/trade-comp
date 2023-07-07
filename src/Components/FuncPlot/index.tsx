import React, { useMemo } from 'react'
import { Expression, GraphingCalculator } from 'desmos-react'
import './style.scss'
import { Card } from '../ui/Card'
import { useCurrentPool } from '../../state/currentPool/hooks/useCurrentPool'
import { bn, formatFloat, weiToNumber } from '../../utils/helpers'
import { CandleChartLoader } from '../ChartLoaders'

const FX = process.env.REACT_APP_FX
const GX = process.env.REACT_APP_GX

export const FunctionPlot = (props: any) => {
  const { currentPool, drC } = useCurrentPool()
  const calc = React.useRef() as React.MutableRefObject<Desmos.Calculator>

  const { PX, a, b, TOKEN_R, R, R1, P, X, MARK } = useMemo(() => {
    const P = currentPool.k?.toNumber() / 2 // = K/2
    const R = formatFloat(weiToNumber(currentPool.states?.R))
    const a = formatFloat(weiToNumber(currentPool.states?.a))
    const b = formatFloat(weiToNumber(currentPool.states?.b))
    const MARK = currentPool.MARK ? currentPool.MARK.mul(currentPool.MARK).mul((bn(10).pow(12))).shr(256) : 1
    const X = (!currentPool.states?.twap || !currentPool.MARK) ? 1 :
      bn(currentPool.states?.twap).mul(currentPool.states?.twap)
      .mul(1000)
      .div(currentPool.MARK).div(currentPool.MARK)
      .toNumber() / 1000
    const TOKEN_R = 'ETH'
    const PX = X * 0.01
    const drA = R * 0
    const drB = R * 0
    const R1 = R + drA + drB + drC

    return { PX, a, b, TOKEN_R, R, R1, P, X, MARK }
  }, [currentPool, drC])

  const drLatex = drC > 0
    ? `x=X\\{g(${P},X,${b},${R})<y<g(${P},X,${b},${R1})\\}`
    : `x=X\\{g(${P},X,${b},${R})>y>g(${P},X,${b},${R1})\\}`

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
        {props.matches ? (
          <div
            className='flex flex-col justify-center items-center pt-[80px] pb-[80px] md:pb-[120px] md:pt-[120px] gap-6'>
            <GraphingCalculator
              attributes={{ className: 'calculator' }}
              fontSize={18}
              keypad
              projectorMode
              settingsMenu={false}
              expressionsCollapsed
              expressions={false}
              zoomButtons={false}
              lockViewport
              invertedColors
              border={false}
              showGrid={false}
              xAxisNumbers={false}
              yAxisNumbers={false}
              ref={calc}
              xAxisArrowMode='POSITIVE'
              yAxisArrowMode='POSITIVE'
              xAxisLabel='Price'
              yAxisLabel='Value'
            >
              <Expression id='f' latex={FX} hidden />
              <Expression id='g' latex={GX} hidden />
              <Expression
                id='lR'
                latex='(0.45,3.1)'
                color='RED'
                hidden
                showLabel
                label='Pool Reserve'
                labelOrientation='RIGHT'
              />
              <Expression
                id='R'
                latex='y=3\{0.02<x\}'
                color='RED'
                lineWidth={1.5}
              />
              <Expression
                id='rC'
                latex='x=X\{f(X)<y<g(X)\}'
                color='ORANGE'
                lineStyle='DASHED'
                lineWidth={1.5}
              />
              <Expression id='short' latex='g(x)\{0.02<x\}' color='GREEN' />
              <Expression id='long' latex='f(x)\{0.02<x\}' color='PURPLE' />
              <Expression
                id='X'
                latex='X=1'
                sliderBounds={{ min: 0.02, max: '', step: '' }}
              />
              <Expression
                id='p'
                latex='p=\operatorname{round}\left(X\cdot2000\right)'
                hidden
              />
              <Expression
                id='Price'
                latex='(X,-0.1)'
                color='BLACK'
                hidden
                showLabel
                label='$${p}'
                labelOrientation='BELOW'
              />
              <Expression id='S' latex='(X,g(X))' color='GREEN' />
              <Expression id='L' latex='(X,f(X))' color='PURPLE' />
              <Expression
                id='rB'
                latex='x=X\{g(X)<y<3\}'
                color='GREEN'
                lineStyle='DASHED'
                lineWidth={1.5}
              />
              <Expression
                id='rA'
                latex='x=X\{0<y<f(X)\}'
                color='PURPLE'
                lineStyle='DASHED'
                lineWidth={1.5}
              />
              <Expression
                id='lC'
                latex='(X+0.15,(1.1g(X)+f(X))/2.1)'
                color='ORANGE'
                hidden
                showLabel
                label='LP'
                labelOrientation='RIGHT'
              />
              <Expression
                id='lB'
                latex='(X-0.3,(g(X)+3)/2)'
                color='GREEN'
                hidden
                showLabel
                label='Short'
                labelOrientation='LEFT'
              />
              <Expression
                id='lA'
                latex='(X+0.25,0.55f(X))'
                color='PURPLE'
                hidden
                showLabel
                label='Long'
                labelOrientation='RIGHT'
              />
            </GraphingCalculator>
          </div>
        ) : (
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
              xAxisLabel={TOKEN_R}
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
              <Expression id='short1' latex={`g(${P},x,${b},${R1})\\{${PX}<x\\}`} color='GREEN' lineStyle='DASHED' />
              <Expression id='long1' latex={`f(${P},x,${a},${R1})\\{${PX}<x\\}`} color='PURPLE' lineStyle='DASHED' />
              <Expression
                id='X'
                latex={`X=${X}`}
                sliderBounds={{ min: PX, max: '', step: '' }}
              />
              <Expression
                id='p'
                latex={`p=\\operatorname{round}(X*${MARK})`}
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
              <Expression id='S1' latex={`(X,g(${P},X,${b},${R1}))`} color='GREEN' />
              <Expression id='L1' latex={`(X,f(${P},X,${a},${R1}))`} color='PURPLE' />
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
                id='dr'
                latex={drLatex}
                color={Desmos.Colors.BLACK}
                lineWidth={3}
              />
              <Expression
                id='lC'
                latex={`(X,(1.1g(${P},X,${b},${R})+f(${P},X,${a},${R}))/2.1)`}
                color={Desmos.Colors.BLACK}
                hidden
                showLabel
                label='LP'
                labelOrientation={Desmos.LabelOrientations.RIGHT}
              />
              <Expression
                id='lB'
                latex={`(X*0.9,(g(${P},X,${b},${R})+${R})/2)`}
                color={Desmos.Colors.GREEN}
                hidden
                showLabel
                label='Short'
                labelOrientation={Desmos.LabelOrientations.LEFT}
              />
              <Expression
                id='lA'
                latex={`(X*1.1,0.55f(${P},X,${a},${R}))`}
                color={Desmos.Colors.PURPLE}
                hidden
                showLabel
                label='Long'
                labelOrientation={Desmos.LabelOrientations.RIGHT}
              />
            </GraphingCalculator>
          </div>
        )}
      </Card>
    </React.Fragment>
  )
}
