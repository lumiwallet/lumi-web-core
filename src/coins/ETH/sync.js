import Request from '@/helpers/Request'
import {restoreClass} from '@/helpers/sync-utils'

/**
 * Class EthereumSync
 * This class allows you to get information about the balance on an ethereum wallet,
 * the list of transactions and optimal gas price
 * @class
 */

export default class EthereumSync {
  /**
   * Create a EthereumSync
   * @param {string} address - Ethereum wallet address
   * @param {string} api - A URL address of Ethereum explorer
   * @param {Object} headers - Request headers
   */
  constructor (address, api, headers) {
    this.address = address
    this.api = api
    this.balance = 0
    this.transactions = []
    this.gasPrice = 0
    this.blockNumber = 0
    this.request = new Request(this.api, headers)
  }

  restore(data = {}) {
    restoreClass(this, data, ['request'])
  }

  /**
   * The method that starts the synchronization Ethereum part of the wallet
   * @returns {Promise<number>}
   * @constructor
   */

  async Start () {
    this.balance = await this.getBalance()
    this.transactions = await this.getTransactions()
    this.gasPrice = await this.getGasPrice()
    this.blockNumber = await this.getBlockNumber()
  }

  /**
   * Request to receive a balance of Ethereum wallet
   * @returns {Promise<number>}
   */

  async getBalance () {
    this.balance = 0

    let params = {
      module: 'account',
      action: 'balance',
      address: this.address,
      tag: 'latest'
    }

    let res = await this.request.send(params)

    return res && res.hasOwnProperty('result') && !isNaN(res.result) ? +res.result : 0
  }

  /**
   * Request to receive Ethereum transaction list
   * @returns {Promise<Array>}
   */

  async getTransactions () {
    this.transactions = []

    let params = {
      module: 'account',
      action: 'txlist',
      address: this.address,
      sort: 'asc'
    }

    let res = await this.request.send(params)

    return res && res.hasOwnProperty('result') && Array.isArray(res.result) ? res.result : []
  }

  /**
   * Request to receive a amount of gas price
   * @returns {Promise<number>}
   */

  async getGasPrice () {
    let params = {
      module: 'proxy',
      action: 'eth_gasPrice'
    }

    let res = await this.request.send(params)

    return res && res.hasOwnProperty('result') ? parseInt(res.result, 16) : 40
  }

  async getBlockNumber () {
    let params = {
      module: 'proxy',
      action: 'eth_blockNumber'
    }

    let res = await this.request.send(params)

    return res && res.hasOwnProperty('result') ? parseInt(res.result) : 0
  }

  get DATA () {
    return {
      address: this.address,
      balance: this.balance,
      transactions: this.transactions,
      gasPrice: this.gasPrice,
      blockNumber: this.blockNumber
    }
  }
}
