import converter from '@/helpers/converters'
import {calcBtcTxSize, getBtcPrivateKeyByIndex, makeRawLtcTx} from '@/helpers/coreHelper'
import CustomError from '@/helpers/handleErrors'
import Request from '@/helpers/Request'

/**
 * List of available commission types for Litecoin transactions
 * @type {Array}
 */

const FEE_IDS = ['regular', 'custom']

/**
 * Class LitecoinTx.
 * This class is responsible for calculating the fee,
 * calculating the available amount to send, and generating and signing a Litecoin transaction
 * @class
 */

export default class LitecoinTx {
  /**
   * Create a LitecoinTx
   * @param {Object} data - Input data for generating a transaction, calculating a fee or available amount
   * @param {Array} data.unspent - Array of unspent addresses
   * @param {number} data.amount - Transaction amount
   * @param {number} data.balance - Litecoin wallet balance
   * @param {Array} data.feeList - Set of rawLitecoin fees
   * @param {Object} data.customFee - Custom fee entered by the user
   * @param {Object} data.nodes - External and internal Litecoin nodes
   * @param {string} data.internalAddress - Address for change
   */
  constructor (data) {
    this.unspent = data.unspent
    this.amount = data.amount ? converter.btc_to_sat(data.amount) : 0
    this.balance = data.balance
    this.customFee = +data.customFee ? +data.customFee : 0
    this.nodes = data.nodes
    this.internalAddress = data.internalAddress
    this.fee = data.feeList
    this.feeList = []
    this.request = new Request(data.api, data.headers)
    this.dust = 1000
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
        LTC: converter.sat_to_btc(item.fee),
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
   * @param {Array} fees - set of commission types
   * @returns {Array} Returns an array with zero fees
   */

  calcEmptyFee (fees) {
    this.feeList = fees.map((item, i) => {
      return {
        id: FEE_IDS[i],
        SAT: 0,
        LTC: 0,
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
      let defaultSize = calcBtcTxSize(index + 1, 2, true)
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
   * Creating a Litecoin transaction
   * @param {Object} data - Input data for a transaction
   * @param {string} data.addressTo - Recipient address
   * @param {Object} data.fee - The transaction fee and list of inputs
   * @returns {Promise<Object>} Returns the raw transaction and transaction hash if sent successfully
   */

  async make (data) {
    const {addressTo, fee} = data

    if (!this.amount) {
      throw new CustomError('err_tx_ltc_amount')
    }

    if (isNaN(fee.SAT)) {
      throw new CustomError('err_tx_ltc_fee')
    }

    const inputsAmount = +fee.inputsAmount
    const amount = +this.amount
    const feeSat = +fee.SAT
    const change = inputsAmount - amount - feeSat
    let inputs = []

    if (change < 0) {
      throw new CustomError('err_tx_ltc_balance')
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
        address: this.internalAddress,
        value: change
      }
    }

    return makeRawLtcTx(params)
  }
}
