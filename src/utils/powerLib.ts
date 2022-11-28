// @ts-nocheck
import _ from 'lodash'
import { bn, formatFloat } from './helpers'
import { BigNumber, ethers } from 'ethers'
const { floor, abs } = Math

const fe = (x: any) => Number(ethers.utils.formatEther(x))
const pe = (x: any) => ethers.utils.parseEther(String(x))

const BN_0 = bn(0)

export type StepType = {
  tokenIn: string,
  tokenOut: string,
  amountIn: BigNumber
  amountOutMin?: BigNumber
}

export class PowerState {
  powers = [2, -2, 8, -8]
  unit = 1000000
  states: any = {}
  constructor(config: any) {
    this.powers = config?.powers ?? [2, -2, 8, -8]
    this.powers = _.orderBy(this.powers.map(Number), Number)
    this.unit = config?.unit ?? 1000000
  }

  loadStates(states: any) {
    this.states = { ...states }
  }

  getMarks() {
    const result = {}
    const exposures = this.getExposures().map(e => Math.floor(e * 10) / 10)
    exposures.forEach((exposure) => {
      result[exposure] = exposure
    })
    return result
  }

  getExposures() {
    return this.powers.map(power => this.calculateExposure(power))
  }

  calculatePrice(power: any, states:any = this.states) {
    const { twapBase, priceScaleLong, priceScaleShort } = states
    let price = bn(this.unit)
    for (let i = 0; i < abs(power); ++i) {
      price = price.mul(twapBase)
    }
    for (let i = 0; i < abs(power); ++i) {
      price = price.div(power > 0 ? priceScaleLong : priceScaleShort)
    }
    if (power < 0) {
      return this.unit / price.toNumber()
    }
    return price.toNumber() / this.unit
  }

  calculateExposure(power: any): any {
    const current = this.calculatePrice(power)
    const projectedStates = {
      ...this.states,
      twapBase: this.states.twapBase.mul(101).div(100)
    }
    const projection = this.calculatePrice(power, projectedStates)
    return (projection - current) / current / 0.01
  }

  calculateCompExposure(balances: any) {
    let totalValue = BN_0
    let totalExposure = BN_0
    for (const power of Object.keys(balances)) {
      const balance = balances[power]
      const price = this.calculatePrice(power)
      const exposure = this.calculateExposure(power)
      totalValue = totalValue.add(balance.mul(floor(this.unit * price)))
      totalExposure = totalExposure.add(balance.mul(floor(this.unit * price * exposure)))
    }
    return totalExposure.mul(this.unit).div(totalValue).toNumber() / this.unit
  }

  calculateCompValue(balances: any) {
    let totalValue = BN_0
    for (const power in balances) {
      const balance = balances[power]
      const price = this.calculatePrice(power)
      totalValue = totalValue.add(balance.mul(floor(this.unit * price)))
    }
    return totalValue.div(this.unit)
  }

  _searchForExposures(es: any, e: any, tolerance: any) {
    es = _.sortBy(es)
    if (e < es[0]) {
      throw new Error('target lower than min exposure: ' + _.min(es))
    }
    if (e > es[es.length - 1]) {
      throw new Error('target higher than max exposure ' + _.max(es))
    }
    const rateTolerance = 1 + tolerance
    for (let i = 0; i < es.length; ++i) {
      const rate = es[i] / e
      if (1 / rateTolerance < rate && rate < rateTolerance) {
        return [i]
      }
      if (es[i] > e) {
        return [i - 1, i]
      }
    }
    throw new Error('not found')
  }

  // V: target value in quoteToken (BN)
  // E: target exposure (float)
  getOptimalBalances(V: any, E: any, tolerance = 0.01) {
    const p = this.powers.map(power => this.calculatePrice(power))
    const e = this.powers.map(power => this.calculateExposure(power))
    const ij = this._searchForExposures(e, E, tolerance)
    if (ij.length === 1) {
      const i = ij[0]
      return {
        [this.powers[i]]: V.mul(floor(this.unit * p[i])).div(this.unit)
      }
    }
    const [i, j] = ij
    // vj = V*(E-ei)/(ej-ei)
    const vj = V.mul(floor((E - e[i]) * this.unit)).div(floor((e[j] - e[i]) * this.unit))
    // bi = (V-vj)/pi
    const bi = V.mul(this.unit).sub(vj.mul(this.unit)).div(floor(p[i] * this.unit))
    // bj = vj / pj
    const bj = vj.mul(this.unit).div(floor(p[j] * this.unit))
    return {
      [this.powers[i]]: bi,
      [this.powers[j]]: bj
    }
  }

  valuesFromBalances(balances: {[key: number]: BigNumber}): {[key: number]: BigNumber} {
    return _.transform(balances, (r: {}, v: BigNumber, k: number) => {
      r[k] = v.mul(floor(this.unit * this.calculatePrice(k)))// .div(this.unit)
    })
  }

  getCPrice() {
    return this.states.twapLP.mul(this.unit).shr(112).toNumber() / this.unit
  }

  getSwapSteps(oldBalances: {[key: number]: BigNumber}, newBalances: {[key: number]: BigNumber}) : StepType[] {
    const oldValues = this.valuesFromBalances(oldBalances)
    const newValues = this.valuesFromBalances(newBalances)
    const changes: {[key: number]: BigNumber} = {}
    for (const power of this.powers) {
      const oldValue = oldValues[power] ?? bn(0)
      const newValue = newValues[power] ?? bn(0)
      const change = newValue.sub(oldValue)
      const changeRate = change.abs().mul(this.unit)
      if (!change.isZero() && (changeRate.gte(newValue) || changeRate.gte(oldValue))) {
        changes[power] = change
      }
    }
    const steps: any[] = []
    while (Object.keys(changes).length > 0) {
      const from = _firstKey(changes, true)
      const to = _firstKey(changes, false)
      if (from == null) {
        steps.push({
          tokenIn: 'C',
          tokenOut: to,
          amountIn: changes[to].div(floor(this.unit * this.getCPrice()))
        })
        delete changes[to]
        continue
      }
      if (to == null) {
        steps.push({
          tokenIn: from,
          tokenOut: 'C',
          amountIn: changes[from].div(floor(-this.unit * this.calculatePrice(from)))
        })
        delete changes[from]
        continue
      }
      if (changes[from].abs().gte(changes[to])) {
        changes[from] = changes[from].add(changes[to])
        steps.push({
          tokenIn: from,
          tokenOut: to,
          amountIn: changes[to].div(floor(this.unit * this.calculatePrice(from)))
        })
        if (changes[from].isZero()) delete changes[from]
        delete changes[to]
      } else {
        changes[to] = changes[to].add(changes[from])
        steps.push({
          tokenIn: from,
          tokenOut: to,
          amountIn: changes[from].div(floor(-this.unit * this.calculatePrice(from)))
        })
        delete changes[from]
      }
    }
    return steps
  }
}

// @ts-ignore
function _firstKey(values: {[key: number]: BigNumber}, negative: boolean = false): number|null {
  let m: number|null = null
  Object.entries(values).forEach(([key, value]) => {
    if (negative && value.gte(0)) return
    if (!negative && value.lte(0)) return
    if (m == null || value.gt(values[m])) {
      // @ts-ignore
      m = key
    }
  })
  return m
}

// entry point testing
if (require.main === module) {
  const powerState = new PowerState({})
  powerState.loadStates({
    twapBase: bn('8788445287819172527008699396495269118'),
    priceScaleLong: bn('7788445287819172527008699396495269118'),
    priceScaleShort: bn('7788445287819172527008699396495269118')
  })

  const balances = powerState.getOptimalBalances(pe('100'), 3.14159)

  Object.entries(balances).map(([power, balance]) => `${power}: ${fe(balance)}`)
    .forEach(console.log)

  const E = powerState.calculateCompExposure(balances)
  console.log(E)

  const current = {
    // '-2': pe(3),
    2: pe(1),
    8: pe(2)
  }

  Object.entries(current).map(([power, balance]) => `${power}: ${fe(balance)}`)
    .forEach(console.log)

  const optimal = powerState.getOptimalBalances(
    powerState.calculateCompValue(current),
    powerState.calculateCompExposure(current)
  )

  Object.entries(optimal).map(([power, balance]) => `${power}: ${fe(balance)}`)
    .forEach(console.log)

  console.log('should be empty', powerState.getSwapSteps(current, optimal))

  const steps: any = powerState.getSwapSteps(current, powerState.getOptimalBalances(pe(123), -3.14159))
  console.log(steps)

  steps.forEach(step => console.log(step.tokenIn, '->', step.tokenOut, fe(step.amountIn)))
}

module.exports = {
  PowerState
}
