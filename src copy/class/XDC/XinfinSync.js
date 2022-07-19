import Request from '@/helpers/Request'

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
   * @param {Object} api - A set of URLs for getting information about xdc address
   * @param {Object} headers - Request headers
   */
  constructor(address, api, headers) {
    this.address = address
    this.api = api
    this.balance = 0
    this.transactions = []
    this.request = new Request(this.api.xdc, headers)
    this.txListRequest = new Request(`${ this.api.xdc }scan`, headers)
    this.gasPrice = 0
  }

  /**
   * The method that starts the synchronization XinFin part of the wallet
   * @returns {Promise<number>}
   * @constructor
   */

  async Start() {
    this.balance = await this.getBalance()

    if (!this.gasPrice) {
      this.gasPrice = await this.getGasPrice()
    }
    await this.getTransactions()
  }

  /**
   * Request to receive a balance of XinFin wallet
   * @returns {Promise<number>}
   */

  async getBalance() {
    this.balance = 0

    let params = {
      jsonrpc: '2.0',
      method: 'eth_getBalance',
      params: [this.address, 'latest'],
      id: 1
    }

    let res = await this.request.send(params)
    return res && res.hasOwnProperty('result') && !isNaN(res.result) ? +res.result : 0
  }

  /**
   * Request to receive XinFin transaction list
   * @returns {Promise<Array>}
   */

  async getTransactions() {
    this.transactions = []

    let params = {
      module: 'account',
      action: 'txlist',
      address: this.address,
      page: 0,
      pageSize: 100
    }

    let req = async () => {
      let res = await this.txListRequest.send(params)

      if (res && res.hasOwnProperty('result') && Array.isArray(res.result)) {
        this.transactions = [...res.result, ...this.transactions]
        if (res.result.length === params.pageSize) {
          params.page++
          await req()
        }
      }
    }

    await req()
  }


  /**
   * Request to getting gasPrice
   * @returns {Promise<number>}
   */

  async getGasPrice() {
    let params = {
      jsonrpc: '2.0',
      method: 'eth_gasPrice',
      params: [],
      id: 1
    }

    let res = await this.request.send(params)
    return res && res.hasOwnProperty('result') && !isNaN(res.result) ? +res.result : 0
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
