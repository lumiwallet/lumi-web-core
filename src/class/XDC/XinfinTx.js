import converter from '@/helpers/converters'
import bigDecimal from 'js-big-decimal'
import {makeRawEthTx} from '@/helpers/coreHelper'
import CustomError from '@/helpers/handleErrors'
import Request from '@/helpers/Request'

/**
 * Class XinfinTx.
 * This class is responsible for calculating the fee and generating and signing a Ethereum transaction
 * @class
 */

export default class XinfinTx {
  /**
   * Create a XinfinTx
   * @param {Object} data - Input data for generating a transaction or calculating a fee
   * @param {string} data.address - Ethereum wallet address
   * @param {Array} data.privateKey - Ethereum private key in Uint8Array format
   * @param {number} data.balance - Ethereum wallet balance
   * @param {number} data.gasPrice - Gas price for transaction
   */
  constructor(data, api, headers) {
    this.address = data.address
    this.privateKey = data.privateKey
    this.balance = data.balance
    this.gasPrice = 2500
    this.gasLimit = 21000
    this.feeInGwei = +bigDecimal.multiply(this.gasPrice, this.gasLimit)
    this.finalFee = bigDecimal.divide(this.feeInGwei, Math.pow(10, 18), 12)
    this.api = api
    this.request = new Request(this.api, headers)
    this.feeList = []
  }

  /**
   * Calculating the fee amount
   * @param {number} customGasPrice - Amount of custom gas price
   * @param {number} customGasLimit - Amount of custom gas limit
   * @returns {Array} A list with the optimal and custom fee
   */

  calcFee(customGasPrice = 0, customGasLimit = 0) {
    this.feeList = [
      {
        id: 'optimal',
        gasPrice: this.gasPrice,
        gasLimit: this.gasLimit,
        fee: this.finalFee
      }
    ]

    return this.feeList
  }

  async getTransactionsCount() {
    this.transactions = []

    let params = {
      jsonrpc: '2.0',
      method: 'eth_getTransactionCount',
      params: [this.address, 'latest'],
      id: 1
    }

    let res = await this.request.send(params)

    return res && res.result ? +res.result : 0
  }

  /**
   * Creating a transaction
   * @param {Object} data - Input data for a transaction
   * @param {string} data.addressTo - Recipient address
   * @param {number} data.amount - Transaction amount in ETH
   * @param {number} data.nonce - Nonce, transaction count of an account
   * @returns {Promise<Object>} Return a raw transaction in hex to send and transaction hash
   */

  async make(data) {
    const {addressTo, value} = data
    const amountInWei = converter.eth_to_wei(value)
    const finalAmount = +bigDecimal.add(amountInWei, bigDecimal.multiply(this.gasPrice, this.gasLimit))
    const surrender = bigDecimal.subtract(this.balance, finalAmount)
    const nonce = await this.getTransactionsCount()
    if (surrender < 0) {
      throw new CustomError('err_tx_eth_balance')
    }

    let params = {
      to: addressTo,
      value: amountInWei,
      nonce,
      gasPrice: this.gasPrice,
      gasLimit: this.gasLimit,
      privateKey: this.privateKey,
      chainId: 50
    }
    return makeRawEthTx(params)
  }

  get DATA() {
    return {
      fee: this.feeList
    }
  }
}
