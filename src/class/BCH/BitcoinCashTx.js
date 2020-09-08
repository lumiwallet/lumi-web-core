import converter from '@/helpers/converters'
import {calcBtcTxSize, getBtcPrivateKeyByIndex, makeRawBchTx} from '@/helpers/coreHelper'
import CustomError from '@/helpers/handleErrors'

const FEE_IDS = ['regular', 'custom']

// const toCashAddress = bchaddr.toCashAddress

export default class BitcoinCashTx {
  constructor (data) {
    this.unspent = data.unspent
    this.nodes = data.nodes
    this.internalAddress = data.internalAddress
    this.amount = data.amount ? converter.btc_to_sat(data.amount) : 0
    this.balance = data.balance
    this.dust = 1000
    this.fee = data.feeList
    this.customFee = +data.customFee ? +data.customFee : 0
    this.feeList = []
  }
  
  async calcFee (size = 0) {
    const fees = [...this.fee.map(item => item.feePerByte), this.customFee]
    
    if (this.amount <= 0 || this.balance < this.amount) {
      return this.calcEmptyFee(fees)
    }
    
    const pArray = fees.map(async fee => {
      return await this.getInputs(fee, size)
    })
    
    const res = await Promise.all(pArray)
    
    this.feeList = res.map((item, i) => {
      return {
        id: FEE_IDS[i],
        SAT: item.fee,
        BCH: converter.sat_to_btc(item.fee),
        fee: fees[i],
        feeInBTC: converter.sat_to_btc(fees[i]),
        inputs: item.inputs,
        inputsAmount: item.inputsAmount,
        custom: FEE_IDS[i] === 'custom'
      }
    })
    
    return this.feeList
  }
  
  calcEmptyFee (fees) {
    this.feeList = fees.map((item, i) => {
      return {
        id: FEE_IDS[i],
        SAT: 0,
        BCH: 0,
        fee: item,
        feeInBTC: converter.sat_to_btc(item),
        inputs: [],
        inputsAmount: 0,
        custom: FEE_IDS[i] === 'custom'
      }
    })
    
    return this.feeList
  }
  
  async getInputs (fee, size) {
    let index = 0
    let inputsAmount = 0
    let inputs = []
    let res = {}
    
    this.dust = size ? 0 : 1000
    
    let req = async () => {
      let item = this.unspent[index]
      let defaultSize = calcBtcTxSize(index + 1, 2)
      let calcFee = size ? size * fee : defaultSize * fee
      
      inputsAmount += item.satoshis
      inputs.push(item)
      
      let total = this.amount + calcFee + this.dust
      
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
  
  async make (data) {
    const {addressTo, fee} = data
    
    if (isNaN(this.amount)) {
      throw new CustomError('err_tx_bch_amount')
    }
    
    if (isNaN(fee.SAT)) {
      throw new CustomError('err_tx_bch_fee')
    }
    
    const inputsAmount = +fee.inputsAmount
    const amount = +this.amount
    const sat = +fee.SAT
    const change = inputsAmount - amount - sat
    
    let inputs = fee.inputs.map(utxo => {
      utxo.key = getBtcPrivateKeyByIndex(this.nodes[utxo.nodeType], utxo.deriveIndex)
      
      return utxo
    })
    
    if (change >= 0) {
      let params = {
        inputs: inputs,
        outputs: [
          {
            address: addressTo,
            satoshis: amount
          }
        ]
      }
      
      if (change !== 0) {
        params.outputs[1] = {
          address: this.internalAddress,
          satoshis: change
        }
      }
      
      return makeRawBchTx(params)
    } else {
      throw new CustomError('err_tx_bch_balance')
    }
  }
}
