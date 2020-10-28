import Wrapper from '@/Wrapper'
import CustomError from '@/helpers/handleErrors'
import {makeRawBtcTx, makeRawEthTx, makeRawBchTx, getBtcPrivateKeyByIndex} from '@/helpers/coreHelper'

export {default as converter} from '@/helpers/converters'
export {default as toDecimal} from '@/helpers/toFormatDecimal'
export {makeRawBtcTx, makeRawEthTx, makeRawBchTx}

/**
 * Class Wallet
 * @class
 */

export default class Wallet {
  /**
   * Create a Wallet
   * @param {Object} api - A set of URLs for getting information about addresses
   */
  constructor (api) {
    this.wrapper = new Wrapper()
    this.core = null
    this.sync = {}
    this.api = {
      bitcoin: '',
      bitcoinFee: '',
      ethereum: '',
      bitcoinCash: ''
    }
    this._apiReady = false
    
    if (api) {
      this.setApiEndpoint(api)
    }
  }
  
  /**
   * Creating a new wallet
   *
   * @param {number} count - Mnemonic words count
   * @returns {Promise<Object>} An object with core's information
   * @returns {string} core.mnemonic - Imported mnemonic
   * @returns {string} core.xprv - xprv key
   * @returns {string} core.from - A import type
   * @returns {Object} core.BTC - A BTC core that contains internal and external nodes, private and public keys and the first external user address
   * @returns {Object} core.ETH - A ETH core that contains node, private and public keys and user address
   */
  
  async createNew (count = 12) {
    let data = {
      data: {
        from: 'new',
        count: count
      },
      api: this.api
    }
    
    this.core = await this.wrapper.method('create', data)
    
    return this.core
  }
  
  /**
   * Creating a wallet by mnemonic
   *
   * @param {string} mnemonic
   * @returns {Promise<Object>} An object with core's information
   * @returns {string} core.mnemonic - Imported mnemonic
   * @returns {string} core.xprv - xprv key
   * @returns {string} core.from - A import type
   * @returns {Object} core.BTC - A BTC core that contains internal and external nodes, private and public keys and the first external user address
   * @returns {Object} core.ETH - A ETH core that contains node, private and public keys and user address
   */
  
  async createByMnemonic (mnemonic = '') {
    if (!mnemonic) {
      throw new CustomError('err_core_mnemonic_empty')
    }
    
    let data = {
      data: {
        from: 'mnemonic',
        mnemonic: mnemonic
      },
      api: this.api
    }
    
    this.core = await this.wrapper.method('create', data)
    
    return this.core
  }
  
  /**
   * Creating a wallet by xprv key
   *
   * @param {string} key - BIP32 Root Key
   * @returns {Promise<Object>} An object with core's information
   * @returns {string} core.mnemonic - Imported mnemonic
   * @returns {string} core.xprv - xprv key
   * @returns {string} core.from - A import type
   * @returns {Object} core.BTC - A BTC core that contains internal and external nodes, private and public keys and the first external user address
   * @returns {Object} core.ETH - A ETH core that contains node, private and public keys and user address
   */
  
  async createByKey (key = '') {
    if (!key) {
      throw new CustomError('err_core_xprv')
    }
    
    let data = {
      data: {
        from: 'xprv',
        key: key
      },
      api: this.api
    }
    
    this.core = await this.wrapper.method('create', data)
    
    return this.core
  }
  
  /**
   * The method starts synchronization of BTC and ETH
   *
   * @returns {Promise<Object>} An object with sync's information
   * @returns {Object} sync.BTC - The BTC object contains the addresses used, the list of transactions, the unspent list, the balance in Satoshi, the latest block and the list of commissions
   * @returns {Object} sync.ETH - The ETH object contains the ethereum address, the balance in wei, the list of transactions and gas price
   */
  
  async syncAll () {
    if (!this._apiReady) {
      throw new CustomError('err_wallet_api')
    }
    
    await Promise.all([
      this.syncBTC(),
      this.syncETH(),
      this.syncBCH()
    ])
    
    return this.sync
  }
  
  /**
   * The method returns node by derivation path
   *
   * @returns {Promise<Object>} Returns object with node information. Every child node contains the following parameters:
   * derivation path, private key in WIF format, public key in hex, btc and eth address
   * @returns {Object} data
   * @returns {number} sync.from - Top of the derivation range
   * @returns {number} sync.to - End of the derivation range
   * @returns {Object} sync.path - Derivation path. It is contains required parameters (purpose, coin, account) and optional (change, index)
   */
  
  async getChildNodes (data) {
    if (!this.core) {
      throw new CustomError('err_wallet_exist')
    }
    
    return await this.wrapper.method('getNodes', data)
  }
  
  /**
   * The method starts synchronization of BTC
   *
   * @returns {Promise<Object>} Returns object with bitcoin synchronization information
   * @returns {Object} sync
   * @returns {Object} sync.addresses - Lists of internal, external and empty bitcoin address
   * @returns {Array} sync.transactions - The list of bitcoin transactions
   * @returns {Array} sync.unspent - The list of unspents addresses
   * @returns {number} sync.balance - Bitcoin balance in Satoshi
   * @returns {number} sync.latestBlock - The last block of the bitcoin blockchain
   * @returns {Array} sync.fee - The list of fee per byte
   */
  
  async syncBTC () {
    if (!this._apiReady) {
      throw new CustomError('err_wallet_api')
    }
    
    this.sync.BTC = await this.wrapper.method('sync', 'BTC')
    
    return this.sync.BTC
  }
  
  /**
   * The method starts synchronization of ETH
   *
   * @returns {Promise<Object>} Returns object with ethereum synchronization information
   * @returns {Object} sync
   * @returns {string} sync.address - Ethereum wallet address
   * @returns {number} sync.balance - Ethereum balance in wei
   * @returns {Array} sync.transactions - The list of ethereum transactions
   * @returns {number} sync.gasPrice - Gas price
   */
  
  async syncETH () {
    if (!this._apiReady) {
      throw new CustomError('err_wallet_api')
    }
    
    this.sync.ETH = await this.wrapper.method('sync', 'ETH')
    
    return this.sync.ETH
  }
  
  async syncBCH () {
    if (!this._apiReady) {
      throw new CustomError('err_wallet_api')
    }
    
    this.sync.BCH = await this.wrapper.method('sync', 'BCH')
    
    return this.sync.BCH
  }
  
  /**
   * The method returns a raw BTC transaction
   *
   * @param {Object} data
   * @param {string} data.inputs - List of transaction inputs. Input contains the following parameters:
   * transaction hash, output n, address, value, script and private key in WIF format
   * @param {string} data.outputs - List of transaction outpus. Output contains the following parameters: address and value
   * @returns {Promise<Object>} Returns object with transaction hash and raw transaction data
   * @returns {string} hash - Transaction hash
   * @returns {string} tx - Raw Bitcoin transaction
   */
  
  async makeRawBtcTx (data) {
    return await makeRawBtcTx(data)
  }
  
  /**
   * The method returns a raw BCH transaction
   *
   * @param {Object} data
   * @param {string} data.inputs - List of transaction inputs. Input contains the following parameters:
   * transaction hash, output n, address, value in satoshis, script and private key in WIF format
   * @param {string} data.outputs - List of transaction outpus. Output contains the following parameters: address and value in satoshis
   * @returns {Promise<Object>} Returns object with transaction hash and raw transaction data
   * @returns {string} hash - Transaction hash
   * @returns {string} tx - Raw Bitcoin Cash transaction
   */
  
  async makeRawBchTx (data) {
    return await makeRawBchTx(data)
  }
  
  /**
   * The method returns a raw ETH transaction
   *
   * @param {Object} data
   * @param {string} data.address - Ethereum address
   * @param {number} data.amount - The transaction's amount in wei
   * @param {number} data.nonce - The transaction's nonce
   * @param {number} data.gasPrice - The transaction's gas price in wei
   * @param {number} data.gasLimit - The transaction's gas limit
   * @param {string} data.privateKey - Private key of ether wallet in hex
   * @returns {Promise<Object>} Returns object with transaction hash and raw transaction data
   * @returns {string} hash - Transaction hash
   * @returns {string} tx - Raw Ethereum transaction
   */
  
  async makeRawEthTx (data) {
    return await makeRawEthTx(data)
  }
  
  /**
   * This method generates a list of transaction fees for the selected currency
   * @param {Object} params
   * @param {Object} params.currency - Selected currency. BTC or ETH
   * @param {Object} params.amount - Amount of transaction
   * @param {Object} params.customFee - Custom fee per byte
   * @param {Object} params.size - Transaction size. Relevant for bitcoin transactions
   * @returns {Promise<Array>} The list of transaction fees
   */
  
  async calculateFee (params) {
    if (!this._apiReady) {
      throw new CustomError('err_wallet_api')
    }
    
    let {currency, amount, customFee, size} = params
    
    return await this.wrapper.method('transaction', {
      method: 'calcFee',
      currency: currency,
      tx: {
        amount: amount,
        customFee: customFee,
        size: size
      }
    })
  }
  
  /**
   * Wrapper for the compilation of transactions of bitcoin and ether
   * @param {Object} data
   * @param {string} data.currency - Transaction currency
   * @param {Object} data.tx
   * @param {string} data.tx.addressTo - Recipient address
   * @param {number} data.tx.amount - Transaction amount
   * @param {number} data.tx.fee - Transaction fee
   * @returns {Promise<Object>}
   * @returns {string} hash - Transaction hash
   * @returns {string} tx - Raw bitcoin or ethereum transaction
   */
  
  async makeTransaction (data) {
    if (!this._apiReady) {
      throw new CustomError('err_wallet_api')
    }
    
    let params = {
      method: 'make',
      currency: data.currency,
      tx: data.tx
    }
    
    return await this.wrapper.method('transaction', params)
  }
  
  /**
   * Sets the API Endpoint
   *
   * @type {Object} api
   * @param {string} api.bitcoin - Url address of bitcoin endpoint
   * @param {string} api.bitcoinFee - Url address of bitcoin fee endpoint
   * @param {string} api.ethereum - Url address of ethereum endpoint
   * @param {string} api.bitcoinCash - Url address of bitcoin cash endpoint
   */
  
  setApiEndpoint (api) {
    if (!api || typeof api !== 'object' || Array.isArray(api)) {
      throw new CustomError('err_wallet_api_type')
    }
    
    for (let key in this.api) {
      if (api.hasOwnProperty(key)) {
        this.api[key] = api[key]
      } else {
        throw Error(`Api must be contains ${ key } value`)
      }
    }
    this._apiReady = true
  }
  
  get Core () {
    return this.core
  }
  
  get getSyncBTC () {
    return this.sync.BTC
  }
  
  get getSyncETH () {
    return this.sync.ETH
  }
  
  get getApiState () {
    return this._apiReady
  }
}
