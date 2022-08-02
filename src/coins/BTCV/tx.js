import converter from '@/helpers/converters'
import {BitcoinBasedTx} from '@/coins/btc-based-tx'
import {getBtcPrivateKeyByIndex} from '@/coins/BTC/utils'
import {makeRawBtcvTx} from './utils'
import CustomError from '@/helpers/handleErrors'

/**
 * Class BitcoinVaultTx.
 * This class is responsible for calculating the fee,
 * calculating the available amount to send, and generating and signing a Bitcoin Vault transaction
 * @class
 */

export default class BitcoinVaultTx extends BitcoinBasedTx{
  /**
   * Create a BitcoinVaultTx
   * @param {Object} data - Input data for generating a transaction, calculating a fee or available amount
   * @param {Array} data.unspent - Array of unspent addresses
   * @param {Array} data.feeList - Set of raw Bitcoin Vault fees
   * @param {Object} data.nodes - External and internal Bitcoin Vault nodes
   */
  constructor (data) {
    super(data)
    this.fees = data.feeList.map(item => {
      item.level = item.name
      return item
    })
    this.feeIds = ['regular', 'custom']
    this.type = 'p2wpkh'
  }

  /**
   * Creating a Bitcoin Vault transaction
   * @param {Object} data - Input data for a transaction
   * @param {string} data.addressTo - Recipient address
   * @param {Object} data.fee - The transaction fee and list of inputs
   * @returns {Promise<Object>} Returns the raw transaction and transaction hash if sent successfully
   */

  async make (data= {}) {
    const {address, fee, amount, changeAddress} = data

    if (!amount) {
      throw new CustomError('err_tx_btcv_amount')
    }

    if (isNaN(fee.value)) {
      throw new CustomError('err_tx_btcv_fee')
    }

    const amountInSat = converter.btc_to_sat(amount)
    const change = fee.inputsAmount - amountInSat - fee.value
    let inputs = []

    for (const utxo of fee.inputs) {
      let item = {
        hash: utxo.tx_hash,
        index: utxo.tx_pos,
        value: utxo.value,
        key: getBtcPrivateKeyByIndex(this.nodes[utxo.nodeType], utxo.deriveIndex)
      }

      inputs.push(item)
    }

    if (change >= 0) {
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

      return makeRawBtcvTx(params)
    } else {
      throw new CustomError('err_tx_btcv_balance')
    }
  }
}
