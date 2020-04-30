import converter from '@/helpers/converters'
import {calcBtcTxSize, makeRawBtcTx} from '@/helpers/coreHelper'
import CustomError from '@/helpers/handleErrors'

/**
 * Class BitcoinTx.
 * This class is responsible for calculating the fee,
 * calculating the available amount to send, and generating and signing a Bitcoin transaction
 * @class
 */

export default class BitcoinTx {
  /**
   * Create a BitcoinTx
   * @param {Object} data - Input data for generating a transaction or calculating a fee or available amount
   * @param {Array} data.unspent - Array of unspent addresses
   * @param {string} data.internalAddress - Address for change
   * @param {number} data.amount - Transaction amount
   * @param {number} data.balance - Bitcoin wallet balance
   * @param {Array} data.feeList - Set of bitcoin fees
   * @param {Object} data.customFee - Custom fee entered by the user
   */
  constructor (data) {
    this.unspent = data.unspent
    this.internalAddress = data.internalAddress
    this.amount = data.amount ? converter.btc_to_sat(data.amount) : 0
    this.balance = data.balance
    this.dust = 1000
    this.fee = data.feeList
    this.customFee = +data.customFee ? +data.customFee : 0
    this.feeList = []
  }
  
  /**
   * Calculating the fee amount
   * @param {number} size - Transaction size
   * @returns {Promise<Array>} Returns a set of fees for a specific transaction amount
   */
  
  // TODO check size
  async calcFee (size = 0) {
    if (this.amount <= 0 || this.balance < this.amount) {
      return this.calcEmptyFee()
    }
    
    let fast = this.fee[2].feePerByte
    let regular = this.fee[1].feePerByte
    let cheap = this.fee[0].feePerByte
    let custom = this.customFee
    
    this.dust = size ? 0 : 1000

    let fastResult = await this.getInputs(fast, size)
    let regularResult = await this.getInputs(regular, size)
    let cheapResult = await this.getInputs(cheap, size)
    let customResult = await this.getInputs(custom, size)
    
    this.feeList = [
      {
        name: 'Fast',
        SAT: fastResult.fee,
        BTC: converter.sat_to_btc(fastResult.fee),
        fee: this.fee[2].feePerByte,
        feeInBTC: converter.sat_to_btc(this.fee[2].feePerByte),
        inputs: fastResult.inputs,
        inputsAmount: fastResult.inputsAmount,
        title: 'Fast 30-60 mins',
        addText: 'per byte'
      },
      {
        name: 'Regular',
        SAT: regularResult.fee,
        BTC: converter.sat_to_btc(regularResult.fee),
        fee: this.fee[1].feePerByte,
        feeInBTC: converter.sat_to_btc(this.fee[1].feePerByte),
        inputs: regularResult.inputs,
        inputsAmount: regularResult.inputsAmount,
        title: 'Regular 1-24 hours',
        addText: 'per byte'
      },
      {
        name: 'Cheap',
        SAT: cheapResult.fee,
        BTC: converter.sat_to_btc(cheapResult.fee),
        fee: this.fee[0].feePerByte,
        feeInBTC: converter.sat_to_btc(this.fee[0].feePerByte),
        inputs: cheapResult.inputs,
        inputsAmount: cheapResult.inputsAmount,
        title: 'Cheap but takes time...',
        addText: 'per byte'
      },
      {
        custom: true,
        name: 'Custom',
        SAT: customResult.fee,
        BTC: converter.sat_to_btc(customResult.fee),
        fee: this.customFee,
        feeInBTC: converter.sat_to_btc(this.customFee),
        inputs: customResult.inputs,
        inputsAmount: customResult.inputsAmount,
        title: 'Custom amount',
        addText: 'Minimum 1 SAT per byte'
      }
    ]
    
    return this.feeList
  }
  
  /**
   * Sets an array of zero fees.
   * Used when the user does not have enough funds for the transaction
   * @returns {Array} Returns an array with zero fees
   */
  
  calcEmptyFee () {
    this.feeList = [
      {
        name: 'Fast',
        SAT: 0,
        BTC: 0,
        fee: this.fee[2].feePerByte,
        feeInBTC: converter.sat_to_btc(this.fee[2].feePerByte),
        inputs: [],
        inputsAmount: 0,
        title: 'Fast 30-60 mins',
        addText: 'per byte'
      },
      {
        name: 'Regular',
        SAT: 0,
        BTC: 0,
        fee: this.fee[1].feePerByte,
        feeInBTC: converter.sat_to_btc(this.fee[1].feePerByte),
        inputs: [],
        inputsAmount: 0,
        title: 'Regular 1-24 hours',
        addText: 'per byte'
      },
      {
        name: 'Cheap',
        SAT: 0,
        BTC: 0,
        fee: this.fee[0].feePerByte,
        feeInBTC: converter.sat_to_btc(this.fee[0].feePerByte),
        inputs: [],
        inputsAmount: 0,
        title: 'Cheap but takes time...',
        addText: 'per byte'
      },
      {
        custom: true,
        name: 'Custom',
        feePerByte: this.customFee,
        fee: 0,
        feeInSat: 0,
        inputs: [],
        inputsAmount: 0,
        title: 'Custom amount',
        addText: 'Minimum 1 SAT per byte'
      }
    ]
    
    return this.feeList
  }
  
  /**
   * Finds a list of inputs for a specific transaction
   * @param {number} fee - Fee size
   * @param {number} size - Transaction size
   * @returns {Promise<Object>} Returns an object with a list of inputs, the total fee amount, and the total amount of all inputs
   */
  
  async getInputs (fee, size) {
    let index = 0
    let inputsAmount = 0
    let inputs = []
    let res = {}
    
    let req = async () => {
      let item = this.unspent[index]
      let defaultSize = calcBtcTxSize(index + 1, 2)
      let calcFee = size ? size * fee : defaultSize * fee
      
      inputsAmount += item.value
      inputs.push(item)
      
      let total = this.amount + calcFee + this.dust
      
      if (inputsAmount < total) {
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
        if (inputsAmount >= total) {
          res = {
            fee: calcFee,
            inputs: inputs,
            inputsAmount: inputsAmount
          }
        } else {
          res = {
            fee: 0,
            inputs: [],
            inputsAmount: 0
          }
        }
      }
    }
    await req()
    return res
  }
  
  /**
   * Creating a transaction
   * @param {Object} data - Input data for a transaction
   * @param {string} data.addressTo - Recipient address
   * @param {Object} data.fee - The transaction fee and list of inputs
   * @param {Object} data.inputsAmount - The amount of inputs involved in the transaction
   * @returns {Promise<Object>} Returns the raw transaction and transaction hash if sent successfully
   */
  
  async make (data) {
    const {addressTo, fee} = data
    
    if (isNaN(this.amount)) {
      throw new CustomError('err_tx_btc_amount')
    }
    
    if (isNaN(fee.SAT)) {
      throw new CustomError('err_tx_btc_fee')
    }
    
    let change = +fee.inputsAmount - +this.amount - +fee.SAT
    
    if (change >= 0) {
      let params = {
        inputs: fee.inputs,
        outputs: [
          {
            address: addressTo,
            value: this.amount
          }
        ]
      }
      
      if (change !== 0) {
        params.outputs[1] = {
          address: this.internalAddress,
          value: change
        }
      }
      
      return makeRawBtcTx(params)
    } else {
      throw new CustomError('err_tx_btc_balance')
    }
  }
}
