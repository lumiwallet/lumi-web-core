import Request from '@/helpers/Request'

/**
 * Class XinfinSync
 * This class allows you to get information about the balance on a ethereum wallet,
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
    this.gasPrice = 0
    this.request = new Request(this.api.xdc, headers)
    this.txListRequest = new Request(`${ this.api.xdc }scan`, headers)
  }

  /**
   * The method that starts the synchronization Ethereum part of the wallet
   * @returns {Promise<number>}
   * @constructor
   */

  async Start() {
    this.balance = await this.getBalance()
    await this.getTransactions()
  }

  /**
   * Request to receive a balance of Ethereum wallet
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

  async getTransactionsCount() {
    this.transactions = []

    let params = {
      jsonrpc: '2.0',
      method: 'eth_getTransactionCount',
      params: [this.address, 'latest'],
      id: 1
    }

    let res = await this.request.send(params)

    return res && res.hasOwnProperty('result') && Array.isArray(res.result) ? res.result : []
  }

  /**
   * Request to receive Ethereum transaction list
   * @returns {Promise<Array>}
   */

  async getTransactions() {
    this.transactions = []

    let params = {
      module: 'account',
      action: 'txlist',
      address: this.address,
      page: 1,
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
   * Request to receive a amount of gas price
   * @returns {Promise<number>}
   */

  // async getGasPrice() {
  //   let params = {
  //     jsonrpc: '2.0',
  //     method: 'eth_gasPrice',
  //     params: [],
  //     id: 1
  //   }
  //
  //   let res = await this.request.send(params)
  //
  //   return res && res.hasOwnProperty('result') ? parseInt(res.result, 16) : 0
  // }

  get DATA() {
    return {
      address: this.address,
      balance: this.balance,
      transactions: this.transactions
      // gasPrice: this.gasPrice
    }
  }
}
