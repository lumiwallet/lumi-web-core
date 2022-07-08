import converter                                from '@/helpers/converters'
import {calcBtcTxSize, getBtcPrivateKeyByIndex} from '@/coins/BTC/utils'
import {makeRawDogeTx}                          from './utils'
import CustomError                              from '@/helpers/handleErrors'
import {CoinsNetwork}                           from '@lumiwallet/lumi-network'
import {hdFromXprv}                             from '@/helpers/core'

const request = CoinsNetwork.doge
/**
 * List of available commission types for Dogecoin transactions
 * @type {Array}
 */

const FEE_IDS = ['regular', 'custom']

/**
 * Class DogecoinTx.
 * This class is responsible for calculating the fee,
 * calculating the available amount to send, and generating and signing a Dogecoin transaction
 * @class
 */

export default class DogecoinTx {
  /**
   * Create a DogecoinTx
   * @param {Object} data - Input data for generating a transaction, calculating a fee or available amount
   * @param {Array} data.unspent - Array of unspent addresses
   * @param {number} data.amount - Transaction amount
   * @param {number} data.balance - Dogecoin wallet balance
   * @param {Array} data.feeList - Set of rawDogecoin fees
   * @param {Object} data.customFee - Custom fee entered by the user
   * @param {Object} data.nodes - External and internal Dogecoin nodes
   * @param {string} data.internalAddress - Address for change
   */
  constructor(data) {
    this.unspent = data.unspent.sort((a, b) => a.value - b.value ? -1 : 1)
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

  async calcFee(amount = 0, customFee = 0, size = 0) {
    let fees = []
    const amountInSat = converter.btc_to_sat(amount)
    for (let item of this.fees) {
      if (FEE_IDS.includes(item.name.toLowerCase())) {
        fees.push(item.feePerByte)
      }
    }
    fees.push(parseInt(customFee))

    if (amountInSat <= 0 || this.balance < amountInSat) {
      return this.calcEmptyFee(fees)
    }

    const pArray = fees.map(async fee => {
      return await this.getInputs(fee, size, amountInSat)
    })

    const res = await Promise.all(pArray)

    this.feeList = res.map((item, i) => {
      return {
        id: FEE_IDS[i],
        value: item.fee,
        coinValue: converter.sat_to_btc(item.fee),
        feePerByte: fees[i],
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

  calcEmptyFee(fees) {
    this.feeList = fees.map((item, i) => {
      return {
        id: FEE_IDS[i],
        value: 0,
        coinValue: 0,
        feePerByte: item,
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

  async getInputs(fee, size, amount) {
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
   * Creating a Dogecoin transaction
   * @param {Object} data - Input data for a transaction
   * @param {string} data.address - Recipient address
   * @param {Object} data.fee - The transaction fee and list of inputs
   * @returns {Promise<Object>} Returns the raw transaction and transaction hash if sent successfully
   */

  async make(data = {}) {
    const {address, amount, fee, changeAddress} = data
    console.log('make', data)
    if (!amount) {
      throw new CustomError('err_tx_doge_amount')
    }

    if (isNaN(fee.value)) {
      throw new CustomError('err_tx_doge_fee')
    }

    const amountInSat = converter.btc_to_sat(amount)
    const change = fee.inputsAmount - amountInSat - fee.value
    let inputs = []
    let hashes = []

    if (change < 0) {
      throw new CustomError('err_tx_doge_balance')
    }

    for (let input of fee.inputs) {
      if (!input.tx) {
        if (input.transaction_hash) {
          hashes.push(input.transaction_hash)
        } else {
          throw new CustomError('err_tx_btc_unspent')
        }
      }
    }

    const unique_hashes = [...new Set(hashes)]
    const rawTxsData = await request.getRawTx(unique_hashes)

    for (const utxo of fee.inputs) {
      hashes.push(utxo.transaction_hash)

      let item = {
        hash: utxo.transaction_hash,
        index: utxo.index,
        address: utxo.address,
        value: utxo.value,
        key: getBtcPrivateKeyByIndex(this.nodes[utxo.node_type], utxo.derive_index)
      }
      let data = rawTxsData.find(item => item.hash === utxo.transaction_hash)
      if (!utxo.tx) {
        item.tx = data ? data.rawData : null
      } else {
        item.tx = utxo.tx
      }

      inputs.push(item)
    }

    let params = {
      inputs: inputs,
      outputs: [
        {
          address,
          value: amountInSat
        }
      ]
    }

    if (change) {
      params.outputs[1] = {
        address: changeAddress,
        value: change
      }
    }
    console.log('params', params)
    return makeRawDogeTx(params)
  }
}
