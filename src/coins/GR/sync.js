import {restoreClass} from '@/helpers/sync-utils'
import {CoinsNetwork} from '@lumiwallet/lumi-network'

import {
  DEFAULT_GAS_LIMIT,
  DEFAULT_GAS_PRICE,
  FEE_CONTRACT_ADDR,
  ACTIVATION_METHOD_SUFFIX
} from './config'

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
  constructor(address, api, headers, env = 'prod') {
    this.address = address
    this.api = api
    this.balance = 0
    this.transactions = []
    this.gasPrice = 0
    this.gasLimit = 0
    this.latestBlock = 0
    this.headers = headers
    this.info = {
      active: false,
      kycFilterLevel: 0,
      kycLevel: 0
    }
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

  async Start() {
    await Promise.all([
      await this.getAddressInfo(),
      await this.getTransactions(),
      await this.getGasInfo(),
      await this.getLatestBlock()
    ])
  }

  /**
   * Request to receive a balance of Graphite wallet
   * @returns {Promise<number>}
   */

  async getBalance() {
    this.balance = await requests.getBalance(this.address, this.headers, this.env)
  }

  /**
   * Request to receive Graphite transaction list
   * @returns {Promise<Array>}
   */

  async getTransactions() {
    this.transactions = await requests.getTransactions(this.address, this.headers, this.env)
  }

  /**
   * Request to receive a amount of gas price
   * @returns {Promise<number>}
   */

  async getGasInfo() {
    const res = await requests.getGasPrice(this.address, this.headers, this.env)

    if (res) {
      this.gasPrice = res.gasPrice || DEFAULT_GAS_PRICE
      const limit = Math.max(res.estimateGas, res.lastEstimateGas)
      this.gasLimit = limit > 0 ? limit : DEFAULT_GAS_LIMIT
    }
  }

  /**
   * Request to receive an info about Graphite wallet
   * @returns {Promise<Object>}
   */

  async getAddressInfo() {
    const {balance, ...info} = await requests.getAddressInfo(this.address, this.headers, this.env)
    this.balance = parseInt(balance)
    this.info = info
  }

  async getLatestBlock() {
    this.latestBlock = await requests.getLatestBlock(this.headers, this.env)
  }

  get DATA() {
    return {
      address: this.address,
      balance: this.balance,
      transactions: this.transactions,
      gasPrice: this.gasPrice,
      gasLimit: this.gasLimit,
      info: this.info,
      latestBlock: this.latestBlock
    }
  }
}
