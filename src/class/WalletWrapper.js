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
      BTC: {},
      ETH: {},
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
      await this.core.generateWallet()
    }
    catch (e) {
      throw new Error(e.message)
    }
  }
  
  // todo
  async CreateCoins (config) {
    try {
      return await this.core.createCoinsCores(config)
    }
    catch (e) {
      throw new Error(e.message)
    }
  }
  
  /**
   * Getting information about bitcoin or ether addresses
   * @param {Object} data - Type of synchronization method
   * @param {string} data.coin - Coin name for synchronization
   * @param {string} data.type - Coin type. There may be p2pkh or p2wpkh
   * @returns {Promise<Object>} Returns object with bitcoin or ethereum synchronization information
   * @constructor
   */
  
  async Sync (data) {
    const {coin, type} = data

    try {
      switch (coin) {
        case 'BTC':
          return await this.SyncBTC(type)
        case 'ETH':
          return await this.SyncETH(type)
        case 'BCH':
          return await this.SyncBCH()
      }
    }
    catch (e) {
      throw new Error(e.message)
    }
  }
  
  /**
   * Getting information about Bitcoin wallet from blockchain
   * @param {string} type - Bitcoin type. There may be p2pkh or p2wpkh
   * @returns {Promise<Object>}
   * @constructor
   */
  // todo docs
  async SyncBTC (type = 'p2pkh') {
    if (!this.sync.BTC[type]) {
      this.sync.BTC[type] = new BitcoinSync(
        this.core.COINS.BTC[type].externalNode,
        this.core.COINS.BTC[type].internalNode,
        this.api,
        type
      )
    }
    
    try {
      await this.sync.BTC[type].Start()
      return this.sync.BTC[type].DATA
    }
    catch (e) {
      console.log('SyncBTC error', e)
    }
  }
  
  /**
   * Getting information about Ethereum wallet from blockchain
   * @returns {Promise<Object>}
   * @constructor
   */
  // todo docs
  async SyncETH (type = 0) {
    if (!this.sync.ETH[type]) {
      this.sync.ETH[type] = new EthereumSync(this.core.COINS.ETH[type].address, this.api)
    }
    
    try {
      await this.sync.ETH[type].Start()
      return this.sync.ETH[type].DATA
    }
    catch (e) {
      console.log('SyncETH error', e)
    }
  }
  
  /**
   * Getting information about Bitcoin Cash wallet from blockchain
   * @returns {Promise<Object>}
   * @constructor
   */
  // todo docs
  async SyncBCH () {
    const type = 'p2pkh'
    if (!this.sync.BCH) {
      this.sync.BCH = new BitcoinCashSync(
        this.core.COINS.BCH[type].externalNode,
        this.core.COINS.BCH[type].internalNode,
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
    const {currency, method, tx, addressType, account} = data

    switch (currency) {
      case 'BTC':
        return this.createBTCTx(method, tx, addressType)
      case 'ETH':
        return this.createETHTx(method, tx, account)
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
   * @param {string} type - Bitcoin type. There may be p2pkh or p2wpkh
   * @returns {Promise<Object>} Information about the transaction or fee
   */
  
  async createBTCTx (method, txData, addressType = 'p2pkh') {
    let BTCdata = {
      unspent: this.sync.BTC[addressType].unspent,
      balance: this.sync.BTC[addressType].balance,
      feeList: this.sync.BTC[addressType].fee,
      amount: txData.amount,
      customFee: txData.customFee,
      api: this.api.bitcoin,
      type: addressType
    }
    
    if (method === 'make') {
      BTCdata.internalAddress = this.sync.BTC[addressType].addresses.empty.internal.address
      BTCdata.nodes = {
        external: this.core.COINS.BTC[addressType].externalNode,
        internal: this.core.COINS.BTC[addressType].internalNode
      }
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
  
  async createETHTx (method, txData, account = 0) {
    let ETHdata = {
      address: this.sync.ETH[account].address,
      gasPrice: this.sync.ETH[account].gasPrice,
      balance: this.sync.ETH[account].balance,
      privateKey: this.core.COINS.ETH[account].privateKey
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
    const type = 'p2pkh'
    
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
        external: this.core.COINS.BCH[type].externalNode,
        internal: this.core.COINS.BCH[type].internalNode
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
