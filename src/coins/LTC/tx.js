import converter from '@/helpers/converters'
import {BitcoinBasedTx} from '@/coins/btc-based-tx'
import {calcBtcTxSize, getBtcPrivateKeyByIndex} from '@/coins/BTC/utils'
import {makeRawLtcTx} from './utils'
import CustomError from '@/helpers/handleErrors'


/**
 * Class LitecoinTx.
 * This class is responsible for calculating the fee,
 * calculating the available amount to send, and generating and signing a Litecoin transaction
 * @class
 */

export default class LitecoinTx extends BitcoinBasedTx{
  /**
   * Create a LitecoinTx
   * @param {Object} data - Input data for generating a transaction, calculating a fee or available amount
   * @param {Array} data.unspent - Array of unspent addresses
   * @param {Array} data.feeList - Set of rawLitecoin fees
   * @param {Object} data.nodes - External and internal Litecoin nodes
   */
  constructor (data) {
    super(data)
    this.feeIds = ['medium', 'custom']
    this.type = 'p2wpkh'
  }

  /**
   * Creating a Litecoin transaction
   * @param {Object} data - Input data for a transaction
   * @param {string} data.addressTo - Recipient address
   * @param {Object} data.fee - The transaction fee and list of inputs
   * @returns {Promise<Object>} Returns the raw transaction and transaction hash if sent successfully
   */

  async make (data) {
    const {address, amount, fee, changeAddress} = data

    if (!amount) {
      throw new CustomError('err_tx_ltc_amount')
    }

    if (isNaN(fee.value)) {
      throw new CustomError('err_tx_ltc_fee')
    }

    const amountInSat = converter.btc_to_sat(amount)
    const change = fee.inputsAmount - amountInSat - fee.value
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

    return makeRawLtcTx(params)
  }
}
