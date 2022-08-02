import converter from '@/helpers/converters'
import {BitcoinBasedTx} from '@/coins/btc-based-tx'
import {getBtcPrivateKeyByIndex} from '@/coins/BTC/utils'
import {makeRawBchTx} from './utils'
import CustomError from '@/helpers/handleErrors'

/**
 * Class BitcoinCashTx.
 * This class is responsible for calculating the fee,
 * calculating the available amount to send, and generating and signing a Bitcoin Cash transaction
 * @class
 */

export class BitcoinCashTx extends BitcoinBasedTx {
  /**
   * Create a BitcoinCashTx
   * @param {Object} data - Input data for generating a transaction, calculating a fee or available amount
   * @param {Array} data.unspent - Array of unspent addresses
   * @param {number} data.balance - Bitcoin Cash wallet balance
   * @param {Array} data.feeList - Set of raw Bitcoin Cash fees
   * @param {Object} data.nodes - External and internal Bitcoin Cash nodes
   */
  constructor (data) {
    super(data)
    this.feeIds = ['regular', 'custom']
    this.type = 'p2pkh'
  }

  /**
   * Creating a Bitcoin Cash transaction
   * @param {Object} data - Input data for a transaction
   * @param {string} data.address - Recipient address
   * @param {Object} data.fee - The transaction fee and list of inputs
   * @returns {Promise<Object>} Returns the raw transaction and transaction hash if sent successfully
   */

  async make (data) {
    const {address, amount, fee, changeAddress} = data

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
          address,
          value: amountInSat
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
