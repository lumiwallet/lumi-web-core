import converter       from '@/helpers/converters'
import {calcBtcTxSize} from '@/coins/BTC/utils'
import {hdFromXprv}    from '@/helpers/core'

export class BitcoinBasedTx {
  constructor(data) {
    this.unspent = data.unspent
    this.balance = this.unspent.reduce((a, b) => a + b.value, 0)
    this.nodes = {
      internal: hdFromXprv(data.nodes.internal),
      external: hdFromXprv(data.nodes.external)
    }
    this.fees = data.feeList
    this.type = data.type
    this.feeList = []
    this.dust = 1000
    this.feeIds = ['fast', 'medium', 'custom']
  }

  async calcFee(amount = 0, customFee = 0, sendAll = false) {
    let fees = []
    let amountInSat = 0

    if (!sendAll) {
      amountInSat = converter.btc_to_sat(amount)
    } else {
      amountInSat = this.balance
    }
    for (let item of this.fees) {
      fees.push(item.feePerByte)
    }
    fees.push(parseInt(customFee))

    if (amountInSat <= 0 || this.balance < amountInSat) {
      return this.calcEmptyFee(fees)
    }

    const pArray = fees.map(async fee => {
      if (sendAll) {
        return await this.getSendAllInputs(fee, amountInSat)
      } else {
        return await this.getInputs(fee, amountInSat)
      }
    })

    const res = await Promise.all(pArray)

    this.feeList = res.map((item, i) => {
      return {
        id: this.feeIds[i],
        value: item.fee,
        coinValue: converter.sat_to_btc(item.fee),
        feePerByte: fees[i],
        inputs: item.inputs,
        inputsAmount: item.inputsAmount,
        custom: this.feeIds[i] === 'custom'
      }
    })

    return this.feeList
  }

  calcEmptyFee(fees) {
    this.feeList = fees.map((item, i) => {
      return {
        id: this.feeIds[i],
        value: 0,
        coinValue: 0,
        feePerByte: item,
        inputs: [],
        inputsAmount: 0,
        custom: this.feeIds[i] === 'custom'
      }
    })

    return this.feeList
  }

  async getSendAllInputs(fee, balance) {
    const size = calcBtcTxSize(this.unspent.length, 1, this.type === 'p2wpkh')
    const calcFee = fee * size
    const amount = balance - calcFee

    if (amount >= 0) {
      return {
        fee: calcFee,
        inputs: this.unspent,
        inputsAmount: balance
      }
    } else {
      return {
        fee: 0,
        inputs: [],
        inputsAmount: 0
      }
    }
  }

  async getInputs(fee, amount) {
    if (!fee) {
      return {
        fee: 0,
        inputs: [],
        inputsAmount: 0
      }
    }
    let index = 0
    let inputsAmount = 0
    let inputs = []
    let res = {}

    this.dust = 1000

    let req = async () => {
      let item = this.unspent[index]
      let defaultSize = calcBtcTxSize(index + 1, 2, this.type === 'p2wpkh')
      let calcFee = defaultSize * fee

      inputsAmount += item.value
      inputs.push(item)

      let total = amount + calcFee + this.dust

      if (total > inputsAmount) {
        index++

        if (index >= this.unspent.length) {
          res = {
            fee: 0,
            inputs: [],
            inputsAmount: 0
          }
        } else {
          await req()
        }
      } else {
        res = {
          fee: calcFee,
          inputs: inputs,
          inputsAmount: inputsAmount
        }
      }
    }
    await req()

    return res
  }
}
