import Core from '@/class/Core'
import BitcoinSync from '@/class/BTC/BitcoinSync'
import EthereumSync from '@/class/ETH/EthereumSync'
import BitcoinCashSync from '@/class/BCH/BitcoinCashSync'
import BitcoinTx from '@/class/BTC/BitcoinTx'
import EthereumTx from '@/class/ETH/EthereumTx'
import BitcoinCashTx from '@/class/BCH/BitcoinCashTx'

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
      SEGWIT: null,
      ETH: null,
      BCH: null
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
        case 'SEGWIT':
          return await this.SyncSEGWIT()
        case 'ETH':
          return await this.SyncETH()
        case 'BCH':
          return await this.SyncBCH()
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
    if (!this.sync.BTC) {
      this.sync.BTC = new BitcoinSync(
        this.core.DATA.BTC.externalNode,
        this.core.DATA.BTC.internalNode,
        this.api,
        'p2pkh'
      )
    }
    
    try {
      await this.sync.BTC.Start()
      return this.sync.BTC.DATA
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
    if (!this.sync.ETH) {
      this.sync.ETH = new EthereumSync(this.core.DATA.ETH.address, this.api)
    }
    
    try {
      await this.sync.ETH.Start()
      return this.sync.ETH.DATA
    }
    catch (e) {
      console.log('SyncETH error', e)
    }
  }
  
  // TODO: DOCS
  async SyncSEGWIT () {
    if (!this.sync.SEGWIT) {
      this.sync.SEGWIT = new BitcoinSync(
        this.core.DATA.SEGWIT.externalNode,
        this.core.DATA.SEGWIT.internalNode,
        this.api,
        'p2wpkh'
      )
    }
    
    try {
      console.log('CORE syncSEGWIT')
      await this.sync.SEGWIT.Start()
      return this.sync.SEGWIT.DATA
    }
    catch (e) {
      console.log('SyncSEGWIT error', e)
    }
  }
  
  // TODO docs
  async SyncBCH () {
    if (!this.sync.BCH) {
      this.sync.BCH = new BitcoinCashSync(
        this.core.DATA.BCH.externalNode,
        this.core.DATA.BCH.internalNode,
        this.api
      )
    }
    
    try {
      await this.sync.BCH.Start()
      return this.sync.BCH.DATA
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
      case 'BCH':
        return this.createBCHTx(method, tx)
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
      unspent: this.sync.BTC.unspent,
      balance: this.sync.BTC.balance,
      feeList: this.sync.BTC.fee,
      amount: txData.amount,
      customFee: txData.customFee
    }
    
    if (method === 'make') {
      BTCdata.internalAddress = this.sync.BTC.addresses.empty.internal.address
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
      address: this.sync.ETH.address,
      gasPrice: this.sync.ETH.gasPrice,
      balance: this.sync.ETH.balance,
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
  
  async createBCHTx (method, txData) {
    let BCHdata = {
      unspent: this.sync.BCH.unspent,
      balance: this.sync.BCH.balance,
      feeList: this.sync.BCH.fee,
      amount: txData.amount,
      customFee: txData.customFee
    }
    
    if (method === 'make') {
      BCHdata.internalAddress = this.sync.BCH.addresses.empty.internal.address
      BCHdata.nodes = {
        external: this.core.DATA.BCH.externalNode,
        internal: this.core.DATA.BCH.internalNode
      }
    }
    
    let tx = new BitcoinCashTx(BCHdata)
    
    switch (method) {
      case 'make':
        return tx.make(txData)
      case 'calcFee':
        return tx.calcFee(txData.size)
      default:
        throw new Error('Unknown BCH txs method')
    }
  }
}
