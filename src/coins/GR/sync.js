import Request from '@/helpers/Request'
import {restoreClass} from '@/helpers/sync-utils'

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
  constructor (address, api, headers) {
    this.address = address
    this.api = api
    this.balance = 0
    this.transactions = []
    this.gasPrice = 0
    this.request = new Request(this.api.main, headers)
    this.requestScan = new Request(this.api.scan, headers)
    console.log('g sync', this)
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
    this.balance = await this.getBalance()
    this.transactions = await this.getTransactions()
    this.gasPrice = await this.getGasPrice()
  }

  /**
   * Request to receive a balance of Graphite wallet
   * @returns {Promise<number>}
   */

  async getBalance () {
    this.balance = 0

    let params = {
      module: 'account',
      action: 'balance',
      address: this.address
    }

    let res = await this.requestScan.send(params)

    return res && res.hasOwnProperty('result') && !isNaN(res.result) ? +res.result : 0
  }

  /**
   * Request to receive Graphite transaction list
   * @returns {Promise<Array>}
   */

  async getTransactions () {
    this.transactions = []

    let params = {
      module: 'account',
      action: 'txlist',
      address: this.address
    }

    let res = await this.requestScan.send(params)

    return res && res.hasOwnProperty('result') && Array.isArray(res.result) ? res.result : []
  }

  /**
   * Request to receive a amount of gas price
   * @returns {Promise<number>}
   */

  async getGasPrice () {
    let params = {
      addressTo: this.address
    }

    let res = await this.request.send(params, 'gas')

    return res && res.hasOwnProperty('result') ? res.result : {
      "gasPrice": "19800000000",
      "estimateGas": "21000",
      "lastEstimateGas": "42000"
    }
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
