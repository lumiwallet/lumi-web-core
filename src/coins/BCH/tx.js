import converter from '@/helpers/converters'
import {calcBtcTxSize, getBtcPrivateKeyByIndex} from '@/coins/BTC/utils'
import {makeRawBchTx} from './utils'
import CustomError from '@/helpers/handleErrors'
import {hdFromXprv} from "@/helpers/core";


/**
 * List of available commission types for Bitcoin Cash transactions
 * @type {Array}
 */

const FEE_IDS = ['regular', 'custom']

/**
 * Class BitcoinCashTx.
 * This class is responsible for calculating the fee,
 * calculating the available amount to send, and generating and signing a Bitcoin Cash transaction
 * @class
 */

export default class BitcoinCashTx {
  /**
   * Create a BitcoinCashTx
   * @param {Object} data - Input data for generating a transaction, calculating a fee or available amount
   * @param {Array} data.unspent - Array of unspent addresses
   * @param {number} data.balance - Bitcoin Cash wallet balance
   * @param {Array} data.feeList - Set of raw Bitcoin Cash fees
   * @param {Object} data.nodes - External and internal Bitcoin Cash nodes
   */
  constructor (data) {
    this.unspent = data.unspent
    this.balance = this.unspent.reduce((a, b) => a + b.value, 0)
    this.nodes = {
      internal: hdFromXprv(data.nodes.internal),
      external: hdFromXprv(data.nodes.external)
    }
    this.fees = data.feeList
    this.feeList = []
    this.dust = 1000
  }

  /**
   * Calculating the fee amount
   * @param {number} size - Transaction size
   * @returns {Promise<Array>} Returns a set of fees for a specific transaction amount
   */

  async calcFee (amount = 0, customFee = 0, size = 0) {
    console.log('BCH calcFee', amount, customFee, size)
    console.log('BCH calcFee', this.fees)
    let fees = []
    const amountInSat = converter.btc_to_sat(amount)

    for (let item of this.fees) {
      if (FEE_IDS.includes(item.level.toLowerCase())) {
        fees.push(item.feePerByte)
      }
    }
    fees.push(parseInt(customFee))

    console.log(amount, this.balance, amountInSat)

    if (amountInSat <= 0 || this.balance < amountInSat) {
      console.log('BCH call calcEmptyFee')
      return this.calcEmptyFee(fees)
    }

    const pArray = fees.map(async fee => {
      return await this.getInputs(fee, size)
    })

    const res = await Promise.all(pArray)

    this.feeList = res.map((item, i) => {
      return {
        id: FEE_IDS[i],
        value: item.fee,
        coinValue: converter.sat_to_btc(item.fee),
        feePerByte: fees[i],
        // SAT: item.fee,
        // BCH: converter.sat_to_btc(item.fee),
        // fee: fees[i],
        // feeInBTC: converter.sat_to_btc(fees[i]),
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
   * @param {Array} fees - set of commission types
   * @returns {Array} Returns an array with zero fees
   */

  calcEmptyFee (fees) {
    console.log('calcEmptyFee', this.fees)
    this.feeList = fees.map((item, i) => {
      return {
        id: FEE_IDS[i],
        value: 0,
        coinValue: 0,
        feePerByte: item,
        // SAT: 0,
        // BCH: 0,
        // fee: item,
        // feeInBTC: converter.sat_to_btc(item),
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

  async getInputs (fee, size, amount) {
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

  /**
   * Creating a Bitcoin Cash transaction
   * @param {Object} data - Input data for a transaction
   * @param {string} data.addressTo - Recipient address
   * @param {Object} data.fee - The transaction fee and list of inputs
   * @returns {Promise<Object>} Returns the raw transaction and transaction hash if sent successfully
   */

  async make (data) {
    const {addressTo, amount, fee, changeAddress} = data

    if (!amount) {
      throw new CustomError('err_tx_bch_amount')
    }

    if (isNaN(fee.value)) {
      throw new CustomError('err_tx_bch_fee')
    }

    const amountInSat = converter.btc_to_sat(amount)
    const change = fee.inputsAmount - amountInSat - fee.value
    let inputs = []

    if (change < 0) {
      throw new CustomError('err_tx_bch_balance')
    }

    for (const utxo of fee.inputs) {
      let item = {
        hash: utxo.transaction_hash,
        index: utxo.index,
        address: utxo.address,
        value: utxo.value,
        key: getBtcPrivateKeyByIndex(this.nodes[utxo.node_type], utxo.derive_index)
      }

      inputs.push(item)
    }

    let params = {
      inputs: inputs,
      outputs: [
        {
          address: addressTo,
          value: amount
        }
      ]
    }

    if (change !== 0) {
      params.outputs[1] = {
        address: changeAddress,
        value: change
      }
    }

    return makeRawBchTx(params)
  }
}
