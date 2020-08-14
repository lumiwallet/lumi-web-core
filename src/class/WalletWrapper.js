import Core from '@/class/Core'
import BitcoinSync from '@/class/BTC/BitcoinSync'
import EthereumSync from '@/class/ETH/EthereumSync'
import BitcoinTx from '@/class/BTC/BitcoinTx'
import EthereumTx from '@/class/ETH/EthereumTx'

/**
 * Class WalletWrapper
 * @class
 */

export default class WalletWrapper {
  /**
   * Create a wallet wrapper
   * @param {Object} params
   * @param {Object} params.data - Input information for creating the core.
   * Contains a method for the creation and optionally a key or mnemonics
   * @param {Object} params.api - A set of URLs for getting information about addresses
   */
  
  constructor (params) {
    this.data = params.data
    this.api = params.api
    this.core = null
    this.sync = {
      BTC: null,
      ETH: null
    }
  }
  
  /**
   * Creating a wallet core
   * @constructor
   */
  
  async Create () {
    try {
      this.core = new Core(this.data)
    }
    catch (e) {
      throw new Error(e.message)
    }
  }
  
  /**
   * Getting information about bitcoin or ether addresses
   * @param {string} type - Type of synchronization method
   * @returns {Promise<Object>} Returns object with bitcoin or ethereum synchronization information
   * @constructor
   */

  async Sync (type) {
    try {
      switch (type) {
        case 'BTC':
          return await this.SyncBTC()
        case 'ETH':
          return await this.SyncETH()
      }
    }
    catch (e) {
      throw new Error(e.message)
    }
  }
  
  /**
   * Getting information about bitcoin addresses
   * @returns {Promise<Object>}
   * @constructor
   */
  
  async SyncBTC () {
    this.Sync.BTC = new BitcoinSync(
      this.core.DATA.BTC.externalNode,
      this.core.DATA.BTC.internalNode,
      this.api
    )

    try {
      await this.Sync.BTC.Start()
      return this.Sync.BTC.DATA
    }
    catch (e) {
      console.log('SyncBTC error', e)
    }
  }
  
  /**
   * Getting information about ethereum address
   * @returns {Promise<Object>}
   * @constructor
   */

  async SyncETH () {
    this.Sync.ETH = new EthereumSync(this.core.DATA.ETH.address, this.api)

    try {
      await this.Sync.ETH.Start()
      return this.Sync.ETH.DATA
    }
    catch (e) {
      console.log('SyncETH error', e)
    }
  }
  
  /**
   * Creating a transaction or getting information about fee
   * @param {Object} data
   * @param {string} data.currency - Transaction currency. 'BTC' or 'ETH'
   * @param {string} data.method - Methods 'make' or 'calcFee'
   * @param {Object} data.tx - Input data for the transaction
   * @returns {Promise<Object>}
   * @constructor
   */

  async Transaction (data) {
    const {currency, method, tx} = data

    switch (currency) {
      case 'BTC':
        return this.createBTCTx(method, tx)
      case 'ETH':
        return this.createETHTx(method, tx)
      default:
        throw new Error('Unknown txs type (currency)')
    }
  }
  
  /**
   * Creating a bitcoin transaction
   * @param {string} method - Method 'make' for creating a transaction and method 'calcFee' for calculating fee
   * @param {Object} txData - Input data for the transaction
   * @returns {Promise<Object>} Information about the transaction or fee
   */

  async createBTCTx (method, txData) {
    let BTCdata = {
      unspent: this.Sync.BTC.unspent,
      balance: this.Sync.BTC.balance,
      feeList: this.Sync.BTC.fee,
      amount: txData.amount,
      customFee: txData.customFee
    }
    
    if (method === 'make') {
      BTCdata.internalAddress = this.Sync.BTC.addresses.empty.internal.address
    }
    
    let tx = new BitcoinTx(BTCdata)

    switch (method) {
      case 'make':
        return tx.make(txData)
      case 'calcFee':
        return tx.calcFee(txData.size)
      default:
        throw new Error('Unknown btc txs method')
    }
  }
  
  /**
   * Creating a ethereum transaction
   * @param {string} method - Method 'make' for creating a transaction and method 'calcFee' for calculating fee
   * @param {Object} txData - Input data for the transaction
   * @returns {Promise<Object>} Information about the transaction or fee
   */
  
  async createETHTx (method, txData) {
    let ETHdata = {
      address: this.Sync.ETH.address,
      gasPrice: this.Sync.ETH.gasPrice,
      balance: this.Sync.ETH.balance,
      privateKey: this.core.DATA.ETH.privateKey
    }

    let tx = new EthereumTx(ETHdata)

    switch (method) {
      case 'make':
        return tx.make(txData)
      case 'calcFee':
        return tx.calcFee()
      default:
        throw new Error('Unknown eth txs method')
    }
  }
}
