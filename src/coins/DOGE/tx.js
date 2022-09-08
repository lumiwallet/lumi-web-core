import converter from '@/helpers/converters'
import {getBtcPrivateKeyByIndex} from '@/coins/BTC/utils'
import {BitcoinBasedTx} from '@/coins/btc-based-tx'
import {makeRawDogeTx} from './utils'
import CustomError from '@/helpers/handleErrors'
import {CoinsNetwork} from '@lumiwallet/lumi-network'
const request = CoinsNetwork.doge

/**
 * Class DogecoinTx.
 * This class is responsible for calculating the fee,
 * calculating the available amount to send, and generating and signing a Dogecoin transaction
 * @class
 */

export class DogecoinTx extends BitcoinBasedTx {
  /**
   * Create a DogecoinTx
   * @param {Object} data - Input data for generating a transaction, calculating a fee or available amount
   * @param {Array} data.unspent - Array of unspent addresses
   * @param {Array} data.feeList - Set of rawDogecoin fees
   * @param {Object} data.nodes - External and internal Dogecoin nodes
   */
  constructor(data) {
    super(data)
    this.headers = data.headers
    this.feeIds = ['medium', 'custom']
    this.type = 'p2pkh'
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
    const rawTxsData = await request.getRawTx(unique_hashes, this.headers)

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

    return makeRawDogeTx(params)
  }
}
