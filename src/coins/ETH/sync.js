import {restoreClass} from '@/helpers/sync-utils'
import {CoinsNetwork} from '@lumiwallet/lumi-network'

const requests = CoinsNetwork.eth

console.log('eth req', requests)
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
   * @param {Object} headers - Request headers
   * @param {string} env
   */
  constructor (address = '', headers = {}, env = 'prod') {
    console.log('eth', address, headers, env)
    this.address = address
    this.balance = 0
    this.transactions = []
    this.gasPrice = 0
    this.blockNumber = 0
    this.headers = headers
    this.env = env
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
    await this.getBalance()
    await this.getTransactions()
    await this.getGasPrice()
    await this.getBlockNumber()
  }

  /**
   * Request to receive a balance of Ethereum wallet
   * @returns {Promise<number>}
   */

  async getBalance () {
    this.balance = await requests.getBalance(this.address, this.headers, this.env)
  }

  /**
   * Request to receive Ethereum transaction list
   * @returns {Promise<Array>}
   */

  async getTransactions () {
    this.transactions = await requests.getTransactions(this.address, this.headers, this.env)
  }

  /**
   * Request to receive an amount of gas price
   * @returns {Promise<number>}
   */

  async getGasPrice () {
    this.gasPrice = await requests.getGasPrice(this.headers, this.env)
    console.log('this.gasPrice', this.gasPrice)
  }

  /**
   * Request to receive a last block number
   * @returns {Promise<number>}
   */

  async getBlockNumber () {
    this.blockNumber = await requests.getBlockNumber(this.headers, this.env)
    console.log('this.blockNumber', this.blockNumber)
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
