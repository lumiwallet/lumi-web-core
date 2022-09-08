import converter from '@/helpers/converters'
import {calcBtcTxSize, getBtcPrivateKeyByIndex, makeRawBtcTx} from './utils'
import CustomError from '@/helpers/handleErrors'
import {CoinsNetwork} from '@lumiwallet/lumi-network'
import {BitcoinBasedTx} from '@/coins/btc-based-tx'

const request = CoinsNetwork.btc

/**
 * Class BitcoinTx.
 * This class is responsible for calculating the fee,
 * calculating the available amount to send, and generating and signing a Bitcoin transaction
 * @class
 */

export class BitcoinTx extends BitcoinBasedTx{
  /**
   * Create a BitcoinTx
   * @param {Object} data - Input data for generating a transaction, calculating a fee or available amount
   * @param {Array} data.unspent - Array of unspent addresses
   * @param {number} data.balance - Bitcoin wallet balance
   * @param {Array} data.feeList - Set of bitcoin fees
   * @param {Object} data.nodes - External and internal nodes required to generate private keys
   * @param {String} data.type - Bitcoin type. There may be p2pkh or p2wpkh
   * @param {Object} data.headers - Request headers
   */

  constructor(data) {
    super(data)
    this.feeIds = ['fast', 'medium', 'custom']
    this.headers = data.headers
    this.type = data.type ? data.type.toLowerCase() : 'p2pkh'
  }

  async make(data = {}) {
    const {address, fee, amount, changeAddress} = data

    if (!amount) {
      throw new CustomError('err_tx_btc_amount')
    }

    if (isNaN(fee.value)) {
      throw new CustomError('err_tx_btc_fee')
    }
    const amountInSat = converter.btc_to_sat(amount)
    const change = fee.inputsAmount - amountInSat - fee.value
    let inputs = []

    if (change < 0) {
      throw new CustomError('err_tx_btc_balance')
    }

    try {
      inputs = await this.getInputsWithTxInfo(fee.inputs)
    }
    catch (e) {
      throw new Error(e.message)
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

    return makeRawBtcTx(params)
  }

  /**
   * Returns the required data to create a transaction
   * @param {Array} inputs - Array of inputs for tx
   * @returns {Promise<Array>} Returns an array of inputs with a private keys and raw transaction data for p2pkh items
   */

  async getInputsWithTxInfo(inputs) {
    try {
      let rawTxsData = []
      let finalInputs = []

      if (this.type === 'p2pkh') {
        let hashes = []

        for (let input of inputs) {
          if (!input.tx) {
            if (input.transaction_hash) {
              hashes.push(input.transaction_hash)
            } else {
              throw new CustomError('err_tx_btc_unspent')
            }
          }
        }
        const unique_hashes = [...new Set(hashes)]

        rawTxsData = await request.getRawTx(unique_hashes, this.headers)

        for (let input of inputs) {
          let item = {
            hash: input.transaction_hash,
            index: input.index,
            address: input.address,
            value: input.value
          }
          if (!input.tx) {
            let data = rawTxsData.find(item => item.hash === input.transaction_hash)
            item.tx = data ? data.rawData : null
          } else {
            item.tx = input.tx
          }
          item.key = input.key || getBtcPrivateKeyByIndex(this.nodes[input.node_type], input.derive_index)

          finalInputs.push(item)
        }
      } else {
        for (let input of inputs) {
          let item = {
            hash: input.transaction_hash,
            index: input.index,
            address: input.address,
            value: input.value
          }
          item.key = input.key || getBtcPrivateKeyByIndex(this.nodes[input.node_type], input.derive_index)
          finalInputs.push(item)
        }
      }

      return finalInputs
    }
    catch (e) {
      throw new Error(e.message)
    }
  }
}
