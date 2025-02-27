import {GraphingCalculator} from 'desmos-react'
import React,{useEffect,useMemo, useState} from 'react'
import {Card} from '../ui/Card'
import {useHedgeUniV3} from './hook/useUniV3'
import './style.scss'
import {zerofy} from '../../utils/helpers'

const calculatePx = (tick: number) => {
  return Math.pow(1.0001, tick);
}

export const HedgeUniV3Plot = () => {
  const calc = React.useRef() as React.MutableRefObject<Desmos.Calculator>
  const uniV3Data = useHedgeUniV3()
  const [p, setP] = useState(5);
  const [d, setD] = useState(0.95);
  const [n, setN] = useState(11);

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
  useEffect(() => {
    if(calc.current)
      calc.current.setMathBounds({
      bottom: -0.2,
      top: 0.2,
      left: 0.8,
      right: 1.2,
    })
  },[calc])
  useEffect(() => {
    if (calc.current && hedgeData?.a && hedgeData?.b) {
      calc.current.setExpression({ id: 'a-slider', latex: `a=${hedgeData?.a}` });
      calc.current.setExpression({ id: 'b-slider', latex: `b=${hedgeData?.b}` });
      calc.current.setExpression({ id: 'cxk', latex: 'c(k)=\\frac{1}{1 - \\frac{( \\sqrt{a} + k \\sqrt{\\frac{1}{b}})}{1 + k}}', hidden: true });
      calc.current.setExpression({ id: 'ik', latex: 'i(k) = (\\frac{2\\sqrt{k}}{1 + k} - 1) \\{ k > 0 \\}', hidden: true });
      calc.current.setExpression({ id: 'gk', latex: 'g(k)= (i(k)*c(k)) ', color: 'RED', lineStyle: 'DASHED' });
      calc.current.setExpression({ id: 'fx', latex: 'f(x) = (\\{ x < a : g(a) + 1 - \\frac{a}{x}, a < x < b : g(x), x > b : g(b) \\}) \\{x>0\\}', color: 'RED' });
      calc.current.setExpression({ id: 'wk', latex: 'w(k) = (\\frac{\\frac{(k^{p} - 1)}{ad} + (k^{-p} - 1)bd}{\\frac{d}{a} + bd}) \\{ k > 0 \\}', lineStyle: 'DASHED', color: 'ORANGE', hidden: true });
      calc.current.setExpression({ id: 'zk', latex: `z(k) = -\\frac{w(k)}{${n}}`, color: 'GREEN', lineStyle: 'DASHED', hidden: true });
      calc.current.setExpression({ id: 'p-slider', latex: `p=${p}` });
      calc.current.setExpression({ id: 'd-slider', latex: `d=${d}` });
      calc.current.setExpression({ id: 'n-slider', latex: `n=${n}` });
      calc.current.setExpression({ id: 'h', latex: 'h = f(x) - z(x)', color: 'BLUE' });
    }
  }, [hedgeData, p, d, n]);

  return (
    <React.Fragment>
      {uniV3Data?.uni3PosLoading ? "loading..." : 
      <div className="pool--pos-info">
        <p><strong>Pool:</strong> {uniV3Data.poolAddress} ({uniV3Data.uni3PosData?.fee ? `${Number(uniV3Data.uni3PosData?.fee) / 1e4}%` : 'N/A'}) ({uniV3Data.token0Data?.symbol}/{uniV3Data.token1Data?.symbol})</p>
        <p><strong>Position ID:</strong> {uniV3Data.uni3PosAddress}-{uniV3Data.uni3PosId}</p>
        <p><strong>Lower/Current/Upper Price:</strong> {zerofy(hedgeData?.pxa || 'N/A')} / {zerofy(hedgeData?.px || 'N/A')} / {zerofy(hedgeData?.pxb || 'N/A')}</p>
      </div> }
      <Card className='p-1 plot-chart-box flex flex-col justify-center items-center pb-[80px] pt-[80px] gap-6'>
      <div className="controls">
          <label>
            p: {' '}
            <input value={p} onChange={(e) => setP(Number(e.target.value))} />
          </label>
           {' '} <label>
            d: {' '}
            <input value={d} onChange={(e) => setD(Number(e.target.value))} />
          </label>
           {' '} <label>
            n: {' '}
            <input value={n} onChange={(e) => setN(Number(e.target.value))} />
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
          xAxisLabel={'PoolV3'}
          yAxisLabel='Value'
        />
      </Card>
    </React.Fragment>
  )
}
