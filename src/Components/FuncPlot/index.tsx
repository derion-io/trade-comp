import React from 'react'
import { Expression, GraphingCalculator } from 'desmos-react'
import './style.scss'
import { Card } from '../ui/Card'

const REACT_APP_FX = 'f(x)=x^2'
const REACT_APP_GX = 'g(x)=3-x^{-2}'

export const FunctionPlot = (props: any) => {
  const calc = React.useRef() as React.MutableRefObject<Desmos.Calculator>
  React.useEffect(() => {
    const handleMouseMove = (event: any) => {
      const calculatorRect: any = document
        .querySelector('.calculator')
        ?.getBoundingClientRect()
      const focusX = calculatorRect.width * 0.27782
      const scaleX = (2.3 * calculatorRect.width) / window.innerWidth
      const clientX = event.clientX - calculatorRect.left
      const x =
        focusX +
        (clientX > focusX
          ? scaleX * Math.pow(clientX - focusX, 0.9)
          : -scaleX * Math.pow(focusX - clientX, 0.78))
      const movementOfXY = calc.current.pixelsToMath({
        x: x,
        y: event.clientY - calculatorRect.top
      })
      calc.current.setExpression({
        id: 'X',
        latex: 'X=' + Math.min(4.25, Math.max(0.02, movementOfXY?.x))
      })
    }

    calc.current.setMathBounds({
      bottom: -0.25,
      left: -0.25,
      top: 3.25,
      right: 4.25
    })
    if (props.matches) {
      document.addEventListener('mousemove', handleMouseMove)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
      }
    }
    return () => {
    }
  }, [calc, props.matches])

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
              <Expression id='f' latex={REACT_APP_FX} hidden />
              <Expression id='g' latex={REACT_APP_GX} hidden />
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
              <Expression id='f' latex={REACT_APP_FX} hidden />
              <Expression id='g' latex={REACT_APP_GX} hidden />
              <Expression
                id='lR'
                latex='(0.72,3.15)'
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
                latex='(X,-0.15)'
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
        )}
      </Card>
    </React.Fragment>
  )
}
