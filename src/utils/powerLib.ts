import _ from 'lodash'
import { bn } from './helpers'
import { BigNumber } from 'ethers'
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

  getMarks() {
    const result = { 0: 0 }
    const exposures = this.getExposures()
    exposures.forEach((exposure) => {
      result[exposure] = exposure
    })
    return result
  }

  getExposures() {
    return this.powers.map(power => this.calculateExposure(power))
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

  calculateExposure(power: any): any {
    const current = this.calculatePrice(power)
    const projectedStates = {
      ...this.states,
      baseTWAP: this.states.baseTWAP.mul(101).div(100)
    }
    const projection = this.calculatePrice(power, projectedStates)
    return Math.floor((projection - current) / current / 0.01 * 10) / 10
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

  getSwapSteps(oldBalances: {[key: number]: BigNumber}, newBalances: {[key: number]: BigNumber}) {
    const steps = []
    const froms = {}
    const tos = {}
    this.powers.forEach((power) => {
      const oldBalance = oldBalances[power] || bn(0)
      const newBalance = newBalances[power] || bn(0)
      const oldValue = this.calculateCompValue({ [power]: oldBalance })
      const newValue = this.calculateCompValue({ [power]: newBalance })
      if (oldValue.gt(newValue) && !oldValue.isZero()) {
        froms[power] = {
          amount: oldBalance.sub(newBalance),
          value: oldValue.sub(newValue),
          valueString: oldValue.sub(newValue).toString()
        }
      } else if (!newValue.isZero()) {
        tos[power] = {
          amount: newBalance.sub(oldBalance),
          value: newValue.sub(oldValue),
          valueString: newValue.sub(oldValue).toString()
        }
      }
    })

    for (const i in froms) {
      let fromValue = froms[i].value
      let fromAmount = froms[i].amount
      for (const j in tos) {
        let step = {}
        const toValue = tos[j].value
        const toAmount = tos[j].amount
        if (toAmount.lte(0) || fromAmount.lte(0)) {
          continue
        }

        if (fromValue.eq(toValue)) {
          step = { from: { [i]: fromAmount }, to: { [j]: toAmount } }
          steps.push(step)
          break
        } else if (fromValue.lt(toValue)) {
          step = { from: { [i]: fromAmount }, to: { [j]: toAmount } }
          tos[j].value = toValue.sub(fromValue)
          tos[j].amount = toAmount.mul(toValue.sub(fromValue)).div(toValue)
          steps.push(step)

          break
        } else {
          const fAmount = fromAmount.mul(toValue).div(fromValue)
          step = { from: { [i]: fAmount }, to: { [j]: toAmount } }
          fromValue = fromValue.sub(toValue)
          fromAmount = fromAmount.sub(fAmount)
          steps.push(step)
        }
      }
    }
    console.log({ tos, froms, steps })

    return steps
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
