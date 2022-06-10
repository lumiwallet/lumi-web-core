import {restoreClass} from '@/helpers/sync-utils'
import {CoinsNetwork} from '@lumiwallet/lumi-network'

const requests = CoinsNetwork.xdc
/**
 * Class XinfinSync
 * This class allows you to get information about the balance on a XinFin wallet,
 * the list of transactions and optimal gas price
 * @class
 */

export default class XinfinSync {
  /**
   * Create a XinfinSync
   * @param {string} address - XinFin wallet address
   * @param {Object} headers - Request headers
   */
  constructor(address, headers) {
    console.log('XinfinSync', address)
    this.address = address
    this.headers = headers
    this.balance = 0
    this.transactions = []
    this.gasPrice = 0
  }

  restore(data = {}) {
    restoreClass(this, data, ['request'])
  }

  /**
   * The method that starts the synchronization XinFin part of the wallet
   * @returns {Promise<number>}
   * @constructor
   */

  async Start() {
    await Promise.all([
      await this.getBalance(),
      await this.getTransactions(),
      await this.getGasPrice(),
    ])
  }

  /**
   * Request to receive a balance of XinFin wallet
   * @returns {Promise<number>}
   */

  async getBalance() {
    this.balance = await requests.getBalance(this.address, this.headers)

    return this.balance
  }

  /**
   * Request to receive XinFin transaction list
   * @returns {Promise<Array>}
   */

  async getTransactions() {
    this.transactions = await requests.getTransactions(this.address, this.headers)

    return this.transactions
  }


  /**
   * Request to getting gasPrice
   * @returns {Promise<number>}
   */

  async getGasPrice() {
    this.gasPrice = await requests.getGasPrice(this.headers)

    return this.gasPrice
  }

  get DATA() {
    return {
      address: this.address,
      balance: this.balance,
      transactions: this.transactions,
      gasPrice: this.gasPrice
    }
  }
}
