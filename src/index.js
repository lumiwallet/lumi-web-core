import Wrapper from '@/Wrapper'
import CustomError from '@/helpers/handleErrors'
import * as helpers from '@/helpers/coreHelper'
import BinanceTx from '@/class/BNB/transaction'

export {default as mnemonicChecker} from 'bip39-checker'
export {default as converter} from '@/helpers/converters'
export {default as toDecimal} from '@/helpers/toFormatDecimal'
import DogecoinTx from '@/class/DOGE/DogecoinTx'

export {
  helpers,
  BinanceTx,
  DogecoinTx
}

console.log('core 1')
/**
 * Currencies that are supported in the wallet
 */
const AVAILABLE_COINS = ['BTC', 'ETH', 'BCH', 'BTCV', 'DOGE', 'LTC', 'BNB', 'XDC']

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
      btc: '',
      btcFee: '',
      eth: '',
      bch: '',
      btcv: '',
      ltc: '',
      doge: '',
      dogeFee: '',
      bnb: '',
      xdc: ''
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
   * @returns {Object} core.hdkey - A hierarchical deterministic keys
   * @returns {Uint8Array} core.seed - Seed
   * @returns {string} core.seedInHex - Seed in hex format
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
   * @returns {Object} core.hdkey - A hierarchical deterministic keys
   * @returns {Uint8Array} core.seed - Seed
   * @returns {string} core.seedInHex - Seed in hex format
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
   * @returns {Object} core.hdkey - A hierarchical deterministic keys
   * @returns {Uint8Array} core.seed - Seed
   * @returns {string} core.seedInHex - Seed in hex format
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
   * Creating a core for each supported currency type
   *
   * @param {Array<{coin: String, type: String}>} coins
   * @param {string} coins[].coin - Short name of coin. Supported coins are BTC, ETH, BCH and BTCV
   * @param {string|number} coins[].type - Coin type (additional). For BTC supported types are p2pkh and p2wpkh. For ETH type is a account number (by default 0).
   * @returns {Object} core.BTC - A BTC core that contains internal and external nodes, private and public keys and the first external user address
   * @returns {Object} core.ETH - A ETH core that contains node, private and public keys and user address
   * */

  async createCoins (coins) {
    if (!coins || !Array.isArray(coins)) {
      coins = [
        {coin: 'BTC', type: 'p2pkh'},
        {coin: 'ETH', type: 0}
      ]
    }

    return await this.wrapper.method('createCoins', coins)
  }

  /**
   * The method returns node by derivation path
   *
   * @param {Object} data
   * @param {number} data.from - Top of the derivation range
   * @param {number} data.to - End of the derivation range
   * @param {string} data.path - Derivation path
   * @param {Array} data.coins - Array of coins for generating addresses
   * @returns {{node: {privateExtendedKey: *, publicExtendedKey: *}, list: []}} Returns object with node information
   * @returns {Object} node - Contains privateExtendedKey and publicExtendedKey
   * @returns {Array} list - Array of child nodes. Every child node contains the following parameters:
   * derivation path, publick key, private key in WIF format and addresses if a list of coins was sent
   */

  async getChildNodes (data) {
    if (!this.core) {
      throw new CustomError('err_wallet_exist')
    }

    return await this.wrapper.method('getNodes', data)
  }

  /**
   * The method starts synchronization of selected coin wallet
   * @param {string} coin - Coin ticker (required)
   * @param {number, string} type - Type of coin (optional)
   * @returns {Promise<Object>} Returns object with synchronization information
   * @returns {Object} sync
   * @returns {string} sync.address - Ethereum wallet address
   * @returns {number} sync.balance - Ethereum balance in wei
   * @returns {Array} sync.transactions - The list of Ethereum transactions
   */
  async startSync ({coin, type}) {
    if (!this._apiReady) {
      throw new CustomError('err_wallet_api')
    }

    if (!coin || typeof coin !== 'string') {
      throw new CustomError('err_sync_coin')
    }
    coin = coin.toUpperCase()

    if (!AVAILABLE_COINS.includes(coin)) {
      throw new CustomError('err_sync_coin_not_supported')
    }

    let sync = {}

    if (typeof type === 'number' || typeof type === 'string') {
      sync = await this.wrapper.method('sync', {coin, type})
      if (!this.sync[coin]) {
        this.sync[coin] = {}
      }

      this.sync[coin][type] = sync
    } else {
      sync = await this.wrapper.method('sync', {coin})
      this.sync[coin] = sync
    }

    return sync
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
   * The method returns a raw BTCV transaction
   *
   * @param {Object} data
   * @param {string} data.inputs - List of transaction inputs. Input contains the following parameters:
   * transaction hash, output n, address, value, script and private key in WIF format
   * @param {string} data.outputs - List of transaction outpus. Output contains the following parameters: address and value
   * @returns {Promise<Object>} Returns object with transaction hash and raw transaction data
   * @returns {string} hash - Transaction hash
   * @returns {string} tx - Raw Bitcoin transaction
   */

  async makeRawBtcvTx (data) {
    return await makeRawBtcvTx(data)
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
   * The method returns a raw DOGE transaction
   *
   * @param {Object} data
   * @param {string} data.inputs - List of transaction inputs. Input contains the following parameters:
   * transaction hash, output n, address, value in satoshis, script and private key in WIF format
   * @param {string} data.outputs - List of transaction outpus. Output contains the following parameters: address and value in satoshis
   * @returns {Promise<Object>} Returns object with transaction hash and raw transaction data
   * @returns {string} hash - Transaction hash
   * @returns {string} tx - Raw Bitcoin Cash transaction
   */

  async makeRawDogeTx (data) {
    return await makeRawDogeTx(data)
  }

  /**
   * The method returns a raw LTC transaction
   *
   * @param {Object} data
   * @param {string} data.inputs - List of transaction inputs. Input contains the following parameters:
   * transaction hash, output n, address, value in satoshis, script and private key in WIF format
   * @param {string} data.outputs - List of transaction outpus. Output contains the following parameters: address and value in satoshis
   * @returns {Promise<Object>} Returns object with transaction hash and raw transaction data
   * @returns {string} hash - Transaction hash
   * @returns {string} tx - Raw Bitcoin Cash transaction
   */

  async makeRawLtcTx (data) {
    return await makeRawLtcTx(data)
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
   * @param {string} params.currency - Selected currency. BTC, ETH, BCH or BTCV
   * @param {string} params.addressType - Address type. Required for BTC transaction. Supported types are p2pkh or p2wpkh
   * @param {string} params.account - Account number. Required for ETH transaction
   * @param {number} params.amount - Amount of transaction
   * @param {number} params.customFee - Custom fee per byte
   * @param {number} params.size - Transaction size. Relevant for bitcoin transactions
   * @returns {Promise<Array>} The list of transaction fees
   */

  async calculateFee (params) {
    if (!this._apiReady) {
      throw new CustomError('err_wallet_api')
    }

    return await this.wrapper.method('transaction', {
      method: 'calcFee',
      currency: params.currency,
      addressType: params.addressType,
      account: params.account,
      tx: {
        amount: params.amount,
        customFee: params.customFee,
        size: params.size
      }
    })
  }

  /**
   * Wrapper for the compilation of transactions of bitcoin and ether
   * @param {Object} data
   * @param {string} data.currency - Transaction currency
   * @param {string} data.addressType - Address type. Required for BTC transaction. Supported types are p2pkh or p2wpkh
   * @param {string} data.account - Account number. Required for ETH transaction
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
      addressType: data.addressType,
      account: data.account,
      tx: data.tx
    }

    return await this.wrapper.method('transaction', params)
  }

  /**
   * Sets the API Endpoint
   *
   * @type {Object} api
   * @param {string} api.btc - Url address of bitcoin endpoint
   * @param {string} api.btcFee - Url address of bitcoin fee endpoint
   * @param {string} api.eth - Url address of ethereum endpoint
   * @param {string} api.bch - Url address of bitcoin cash endpoint
   * @param {string} api.btcv - Url address of bitcoin vault endpoint
   * @param {string} api.ltc - Url address of litecoin endpoint
   * @param {string} api.doge - Url address of dogecoin endpoint
   * @param {string} api.dogeFee - Url address of dogecoin endpoint
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

  /**
   * Set request headers
   *
   * @type {Object} headers - Set of HTTP headers
   */

  setHeaders(headers) {
    this.wrapper.method('setHeaders', headers)
  }

  get Core () {
    return this.core
  }

  get getApiState () {
    return this._apiReady
  }
}
