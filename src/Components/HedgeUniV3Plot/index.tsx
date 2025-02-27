import React, { useEffect, useMemo } from 'react'
import { Expression, GraphingCalculator } from 'desmos-react'
import './style.scss'
import { Card } from '../ui/Card'
import { useCurrentPool } from '../../state/currentPool/hooks/useCurrentPool'
import {
  formatFloat,
  zerofy,
  isUSD,
  WEI,
  IEW,
  calcPoolSide,
  div,
  NUM,
  bn
} from '../../utils/helpers'
import { CandleChartLoader } from '../ChartLoaders'
import { useListTokens } from '../../state/token/hook'
import { useHelper } from '../../state/config/useHelper'
import { POOL_IDS } from '../../utils/constant'
import { BigNumber } from 'ethers'
import { useConfigs } from '../../state/config/useConfigs'
import { useHedgeUniV3 } from './hook/useUniV3'
import { error } from 'console'

const FX = 'f(x)=\\{y=x^2}'
const GX = 'g(P,x,v,R)=\\{2vx^{-P}<R:R-vx^{-P},R^2/(4vx^{-P})\\}'
const vX = 'v(k)=\\{ \\}'
const calculatePx = (tick: number) => {
  return Math.pow(1.0001, tick);
}

export const HedgeUniV3Plot = (props: any) => {
  const cp = useCurrentPool()
  const calc = React.useRef() as React.MutableRefObject<Desmos.Calculator>
  const uniV3Data = useHedgeUniV3()

  const hedgeData = useMemo(() => {
    const {
      tick,
      uni3PosData,
      token0Data,
      token1Data,
      poolLiquidity,
      sqrtPriceX96
    } = uniV3Data
    if (!uni3PosData || !tick || !token0Data || !token1Data) return;
    const { tickLower, tickUpper } = uni3PosData
    const normalize = (as: BigNumber[]): number[] => {
      const ls = as.map((b) => b.toString().length)
      const maxL = Math.max(...ls)
      const minL = Math.min(...ls)
      const avgL = (maxL + minL) >> 1
      return as.map((a) => formatFloat(IEW(String(a), avgL)))
    }
    const diffDecimals = Math.abs(token0Data.decimals - token1Data.decimals)
    const px = calculatePx(tick)
    const a = calculatePx(tickLower) / px
    const b = calculatePx(tickUpper) / px
    console.log('#px', a,b, px * (10 ** diffDecimals))
    return {px, a,b}
  }, [uniV3Data])

  useEffect(() => {
    // if(hedgeData?.a && hedgeData?.b){
    if(calc.current){
      calc.current.setExpression({ id: 'a-slider', latex: 'a=0.8' });
      calc.current.setExpression({ id: 'b-slider', latex: 'b=1.2' });
      calc.current.setExpression({ id: 'yx2', latex: 'c(k) = \\frac{1}{1 - \\frac{\\left( \\sqrt{a} + k \\sqrt{\\frac{1}{b}} \\right)}{1 + k}}', color: 'PURPLE'});
      calc.current.setExpression({ id: 'yx2', latex: 'y=x^2', color: 'BLUE'});
      calc.current.setExpression({ id: 'yx3', latex: 'y=x^3', color: 'RED' });

      // var a = calc.current.HelperExpression({ latex: 'a' });
    }
      // const equation = `c(k) = (1 / (1 - ((sqrt(0.8) + k * sqrt(1/1.2)) / (1 + k)))) * 0.8`;
      // calc.current.setExpression({ id: 'graph2', latex: equation });
    // }
  }, [hedgeData])
  return (
    <React.Fragment>
      <Card className='p-1 plot-chart-box flex flex-col justify-center items-center pb-[80px] pt-[80px] gap-6'>
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
        >
            {/* {hedgeData && (
            <Expression
              id="positionValue"
              latex={`v(x) = \\{ ${hedgeData.a} < x < ${hedgeData.b} : x \\}`}
              color="BLUE"
              lineWidth={2}
            />
          )} */}
          <Expression id="slider" latex="y=x^2" />
          <Expression id="slider" latex="a=3" />
          <Expression id="abc" latex='`c(k) = (1 / (1 - ((sqrt(0.8) + k * sqrt(1/1.2)) / (1 + k)))) * 0.8' color='RED'/>
          {/* <Expression id='f' latex={FX} color='RED' />
          <Expression id='g' latex={GX} /> */}
          {/* <Expression
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
            hidden={R === R1}
            lineWidth={1.5}
            lineStyle='DASHED'
          /> */}
          {/* <Expression
              id='rC'
              latex={`x=X\\{f(${P},X,${a},${R})<y<g(${P},X,${b},${R})\\}`}
              color='ORANGE'
              lineStyle='DASHED'
              lineWidth={1.5}
            /> */}
          {/* <Expression
            id='short'
            latex={`g(${P},x,${b},${R})\\{${PX}<x\\}`}
            color='GREEN'
          />
          <Expression
            id='long'
            latex={`f(${P},x,${a},${R})\\{${PX}<x\\}`}
            color='PURPLE'
          />
          <Expression
            id='short1'
            latex={`g(${P},x,${b1},${R1})\\{${PX}<x\\}`}
            color='GREEN'
            lineStyle='DASHED'
            hidden={!drBChange && R1 === R}
          />
          <Expression
            id='long1'
            latex={`f(${P},x,${a1},${R1})\\{${PX}<x\\}`}
            color='PURPLE'
            lineStyle='DASHED'
            hidden={!drAChange && R1 === R}
          />
          <Expression
            id='Price'
            latex={`(${X},0)`}
            color='BLACK'
            hidden
            showLabel
            label={`${dollar}${pX(X, mark)}`}
            labelOrientation={Desmos.LabelOrientations.BELOW}
          />
          <Expression
            id='AD'
            latex={`(${AD},${R1 / 2})`}
            color='PURPLE'
            pointSize={20}
            pointOpacity={0.5}
            showLabel
            label={`${dollar}${pX(AD, mark)}`}
            labelOrientation={Desmos.LabelOrientations.RIGHT}
          />
          <Expression
            id='BD'
            latex={`(${BD},${R1 / 2})`}
            color='GREEN'
            pointSize={20}
            pointOpacity={0.5}
            showLabel
            label={`${dollar}${pX(BD, mark)}`}
            labelOrientation={Desmos.LabelOrientations.LEFT}
          />
          <Expression
            id='S'
            latex={`(${X},g(${P},${X},${b},${R}))`}
            color='GREEN'
          />
          <Expression
            id='L'
            latex={`(${X},f(${P},${X},${a},${R}))`}
            color='PURPLE'
          />
          <Expression
            id='S1'
            latex={`(${X},g(${P},${X},${b1},${R1}))`}
            color='GREEN'
            hidden={drBChange == null}
          />
          <Expression
            id='L1'
            latex={`(${X},f(${P},${X},${a1},${R1}))`}
            color='PURPLE'
            hidden={drAChange == null}
          /> */}
          {/*
            <Expression
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
            />
            */}
          {/*
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
            */}
          {/* <Expression
            id='lC'
            latex={`(${AD + BD}/2,${Math.min(R, R1)}/2)`}
            color='BLACK'
            hidden
            showLabel
            label='LP'
            labelOrientation={Desmos.LabelOrientations.DEFAULT}
          />
          <Expression
            id='lB'
            latex={`(${BD}/2,${Math.max(R, R1)}*3/4)`}
            color='GREEN'
            hidden
            showLabel
            label='SHORT'
            labelOrientation={Desmos.LabelOrientations.DEFAULT}
          />
          <Expression
            id='lA'
            latex={`(${AD}*1.1,${Math.min(R, R1)}/4)`}
            color='PURPLE'
            hidden
            showLabel
            label='LONG'
            labelOrientation={Desmos.LabelOrientations.DEFAULT}
          /> */}
        </GraphingCalculator>
      </Card>
    </React.Fragment>
  )
}
