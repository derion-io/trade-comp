import _ from 'lodash'
import { bn } from './helpers'
const { floor, abs } = Math

const BN_0 = bn(0)

export class PowerState {
  powers = [2, -2, 8, -8]
  unit = 1000000
  states: any = {}
  constructor(config: any) {
    this.powers = config?.powers ?? [2, -2, 8, -8]
    this.powers = this.powers.sort(Number)
    this.unit = config?.unit ?? 1000000
  }

  loadStates(states: any) {
    this.states = { ...states }
  }

  calculatePrice(power: any, states:any = this.states) {
    const { baseTWAP, priceScaleLong, priceScaleShort } = states
    let price = bn(this.unit)
    for (let i = 0; i < abs(power); ++i) {
      price = price.mul(baseTWAP)
    }
    for (let i = 0; i < abs(power); ++i) {
      price = price.div(power > 0 ? priceScaleLong : priceScaleShort)
    }
    if (power < 0) {
      return this.unit / price.toNumber()
    }
    return price.toNumber() / this.unit
  }

  calculateExposure(power: any) {
    const current = this.calculatePrice(power)
    const projectedStates = {
      ...this.states,
      baseTWAP: this.states.baseTWAP.mul(101).div(100)
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

  _searchForExposures(es: any, e: any, tolerance: any) {
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
}

// entry point testing
// if (require.main === module) {
//     const powerState = new PowerState()
//     powerState.loadStates({
//         baseTWAP: bn('7788445287819172527008699396495269118'),
//         priceScaleLong: bn('7788445287819172527008699396495269118'),
//         priceScaleShort: bn('7788445287819172527008699396495269118'),
//     })

//     const balances = powerState.getOptimalBalances(numberToWei('100'), 3.14159)

//     Object.entries(balances).map(([power, balance]) => `${power}: ${fe(balance)}`)
//         .forEach(console.log)

//     const E = powerState.calculateCompExposure(balances)
//     console.log(E)
// }

module.exports = {
  PowerState
}
