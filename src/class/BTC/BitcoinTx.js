import converter from '@/helpers/converters'
import {calcBtcTxSize, makeRawBtcTx} from '@/helpers/coreHelper'
import CustomError from '@/helpers/handleErrors'

/**
 * List of available commission types for Bitcoin transactions
 * @type {Array}
 */

const FEE_IDS = ['fast', 'regular', 'cheap', 'custom']

/**
 * Class BitcoinTx.
 * This class is responsible for calculating the fee,
 * calculating the available amount to send, and generating and signing a Bitcoin transaction
 * @class
 */

export default class BitcoinTx {
  /**
   * Create a BitcoinTx
   * @param {Object} data - Input data for generating a transaction, calculating a fee or available amount
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
        BTC: converter.sat_to_btc(item.fee),
        fee: fees[i],
        feeInBTC: converter.sat_to_btc(fees[i]),
        inputs: item.inputs,
        inputsAmount: item.inputsAmount,
        custom: FEE_IDS[i] === 'custom'
      }
    })
    
    return this.feeList
  }
  
  /**
   * Sets an array of zero fees.
   * Used when the user does not have enough funds for the transaction
   * @returns {Array} Returns an array with zero fees
   */
  
  calcEmptyFee (fees) {
    this.feeList = fees.map((item, i) => {
      return {
        id: FEE_IDS[i],
        SAT: 0,
        BTC: 0,
        fee: item,
        feeInBTC: converter.sat_to_btc(item),
        inputs: [],
        inputsAmount: 0,
        custom: FEE_IDS[i] === 'custom'
      }
    })
    
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
    
    this.dust = size ? 0 : 1000
    
    let req = async () => {
      let item = this.unspent[index]
      let defaultSize = calcBtcTxSize(index + 1, 2)
      let calcFee = size ? size * fee : defaultSize * fee
      
      inputsAmount += item.value
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
  
  /**
   * Creating a Bitcoin transaction
   * @param {Object} data - Input data for a transaction
   * @param {string} data.addressTo - Recipient address
   * @param {Object} data.fee - The transaction fee and list of inputs
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
