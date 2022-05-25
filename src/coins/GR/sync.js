import {restoreClass} from '@/helpers/sync-utils'
import {CoinsNetwork} from '@lumiwallet/lumi-network'

const requests = CoinsNetwork.graphite

/**
 * Class GraphiteSync
 * This class allows you to get information about the balance on a graphite wallet,
 * the list of transactions and optimal gas price
 * @class
 */

export default class GraphiteSync {
  /**
   * Create a GraphiteSync
   * @param {string} address - Graphite wallet address
   * @param {Object} api - URL addresses of Graphite explorer
   * @param {Object} headers - Request headers
   */
  constructor (address, api, headers, env = 'prod') {
    this.address = address
    this.api = api
    this.balance = 0
    this.transactions = []
    this.gasPrice = 0
    this.headers = headers
    this.env = env
  }

  restore(data = {}) {
    restoreClass(this, data, ['request'])
  }

  /**
   * The method that starts the synchronization Graphite part of the wallet
   * @returns {Promise<number>}
   * @constructor
   */

  async Start () {
    await Promise.all([
      await this.getBalance(),
      await this.getTransactions(),
      await this.getGasPrice()
    ])
  }

  /**
   * Request to receive a balance of Graphite wallet
   * @returns {Promise<number>}
   */

  async getBalance () {
    this.balance = await requests.getBalance(this.address, this.headers, this.env)
  }

  /**
   * Request to receive Graphite transaction list
   * @returns {Promise<Array>}
   */

  async getTransactions () {
    this.transactions = await requests.getTransactions(this.address, this.headers, this.env)
  }

  /**
   * Request to receive a amount of gas price
   * @returns {Promise<number>}
   */

  async getGasPrice () {
    this.gasPrice = await requests.getGasPrice(this.address, this.headers, this.env)
  }

  get DATA () {
    return {
      address: this.address,
      balance: this.balance,
      transactions: this.transactions,
      gasPrice: this.gasPrice
    }
  }
}
