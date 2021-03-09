import {validateMnemonic} from 'bip39'
import {normalize, checkWords} from 'bip39-checker'
import CustomError from '@/helpers/handleErrors'
import * as core from '@/helpers/coreHelper'

/**
 * Class Wallet
 * @class
 */

export default class Core {
  /**
   * Create a core
   * @param {Object} data
   * @param {string} data.from - A type new wallet creating: new, mnemonic or xprv
   * @param {number} data.count - Number of words for the new mnemonic. Is used when parameter from is 'new'
   * @param {string} data.mnemonic - The mnemonic phrase. It used when parameter from is 'mnemonic'
   * @param {string} data.key - BIP32 Root Key. It used when parameter from is 'mnemonic'
   */
  constructor (data = {}) {
    const {from, count, mnemonic, key} = data
    this.from = from
    this.count = count || 12
    this.mnemonic = mnemonic
    this.xprv = key
    this.seed = null
    this.hdkey = null
    this.coins = {}
  }
  
  /**
   * The main method that starts the generation of the core.
   * The type of generation depends on the parameter 'from'
   */
  
  async generateWallet () {
    switch (this.from) {
      case 'new':
        this._generateNewMnemonic()
        break
      case 'mnemonic':
        this._importByMnemonic()
        break
      case 'xprv':
        this._importByKey()
        break
      default:
        this._generateNewMnemonic()
    }
  }
  
  /**
   * Generating a new mnemonic.
   * The number of words in a mnemonic depends on the parameter 'count'
   * @private
   */
  
  _generateNewMnemonic () {
    const entropy = this._getEntropyLength(this.count)
    this.mnemonic = core.generateMnemonic(entropy)
    this.seed = core.mnemonicToSeed(this.mnemonic)
    this.hdkey = core.hdFromSeed(this.seed)
    this.xprv = core.getXprv(this.hdkey)
  }
  
  /**
   * Importing a wallet by mnemonic
   * @private
   */
  
  _importByMnemonic () {
    this.mnemonic = normalize(this.mnemonic)
    
    if (!this.checkMnemonic(this.mnemonic)) {
      throw new CustomError('err_core_mnemonic')
    }
    
    this.seed = core.mnemonicToSeed(this.mnemonic)
    this.hdkey = core.hdFromSeed(this.seed)
    this.xprv = core.getXprv(this.hdkey)
  }
  
  /**
   * Importing a wallet by key
   * @private
   */
  
  _importByKey () {
    if (!this.xprv || typeof this.xprv !== 'string') {
      throw new CustomError('err_core_xprv')
    }
    this.hdkey = core.hdFromXprv(this.xprv)
  }
  
  /**
   * Creating a core for each supported currency type
   *
   * @param {Array<{coin: String, type: String}>} coins
   * @param {string} coins[].coin - Short name of coin. Supported coins are BTC, ETH, BCH and BTCV
   * @param {string|number} coins[].type - Coin type (additional).
   * For BTC supported types are p2pkh and p2wpkh. For ETH type is a account number (by default 0).
   * */
  
  async createCoinsCores (coins = {}) {
    let core = {}
    
    for (let item of coins) {
      const {coin, type} = item
      if (!core.hasOwnProperty(coin)) {
        core[coin] = {}
      }
      switch (coin) {
        case 'BTC':
          core[coin][type] = await this._generateBTCcore(type)
          break
        case 'ETH':
          core[coin][type] = await this._generateETHcore(type)
          break
        case 'BCH':
          core[coin][type] = await this._generateBCHcore()
          break
        case 'BTCV':
          core[coin][type] = await this._generateBTCVcore()
          break
      }
    }
    
    return core
  }
  
  /**
   * Creating a core for Bitcoin.
   * At the output, we get a external and internal node,
   * derivation path and the first addresses of the external and internal cores
   *
   * @param {string} type - Bitcoin type. There may be p2pkh or p2wpkh
   * @private
   */
  
  _generateBTCcore (type = 'p2pkh') {
    const bitcoin_paths = {
      p2pkh: `m/44'/0'/0'`,
      p2wpkh: `m/84'/0'/0'`
    }
    
    if (!(type in bitcoin_paths)) {
      throw new CustomError('err_core_btc_type')
    }
    
    const bitcoin_external_path = bitcoin_paths[type] + '/0'
    const bitcoin_internal_path = bitcoin_paths[type] + '/1'
    
    let item = {}
    item.externalNode = core.derive(this.hdkey, bitcoin_external_path)
    item.internalNode = core.derive(this.hdkey, bitcoin_internal_path)
    item.externalAddress = core.getBtcAddress(item.externalNode, 0, type)
    item.internalAddress = core.getBtcAddress(item.internalNode, 0, type)
    item.dp = {
      external: bitcoin_external_path,
      internal: bitcoin_internal_path
    }
    
    if (!this.coins.hasOwnProperty('BTC')) {
      this.coins.BTC = {}
    }

    this.coins.BTC[type] = item
    return item
  }
  
  /**
   * Creating a core for Ethereum.
   * At the output, we get a Ethereum node, derivation path,
   * a private and public key, and the Ethereum address
   *
   * @param {number} type - Ethereum account number. By default 0
   * @private
   */
  
  _generateETHcore (type = 0) {
    if (!Number.isInteger(type)) {
      throw new CustomError('err_core_eth_account')
    }
    
    const ethereum_path = `m/44'/60'/${ type }'/0/0`
    let item = {}
    
    item.node = core.derive(this.hdkey, ethereum_path)
    item.privateKey = core.getEthPrivateKey(item.node)
    item.privateKeyHex = '0x' + item.privateKey.toString('hex')
    item.publicKey = core.getEthPublicKey(item.privateKey)
    item.externalAddress = core.getEthAddress(item.publicKey)
    item.dp = ethereum_path
    
    if (!this.coins.hasOwnProperty('ETH')) {
      this.coins.ETH = {}
    }
    
    this.coins.ETH[type] = item
    return item
  }
  
  /**
   * Creating a core for Bitcoin Cash.
   * At the output, we get a external and internal node,
   * derivation path and the first addresses of the external and internal cores
   * @private
   */
  
  _generateBCHcore () {
    const type = 'p2pkh'
    const bitcoincash_external_path = `m/44'/145'/0'/0`
    const bitcoincash_internal_path = `m/44'/145'/0'/1`
    
    let item = {}
    item.externalNode = core.derive(this.hdkey, bitcoincash_external_path)
    item.internalNode = core.derive(this.hdkey, bitcoincash_internal_path)
    item.externalAddress = core.getBtcAddress(item.externalNode, 0)
    item.internalAddress = core.getBtcAddress(item.internalNode, 0)
    item.dp = {external: bitcoincash_external_path, internal: bitcoincash_internal_path}
    
    if (!this.coins.hasOwnProperty('BCH')) {
      this.coins.BCH = {}
    }
    
    this.coins.BCH[type] = item
    return item
  }
  
  /**
   * Creating a core for Bitcoin Vault.
   * At the output, we get a external and internal node,
   * derivation path and the first addresses of the external and internal cores
   * @private
   */
  async _generateBTCVcore () {
    const type = 'p2wpkh'
    const network = 'btcv'
    const bitcoinvault_external_path = `m/84'/440'/0'/0`
    const bitcoinvault_internal_path = `m/84'/440'/0'/1`
    
    let item = {}
    item.externalNode = core.derive(this.hdkey, bitcoinvault_external_path)
    item.internalNode = core.derive(this.hdkey, bitcoinvault_internal_path)
    item.externalAddress = core.getBtcAddress(item.externalNode, 0, 'p2wpkh', network)
    item.internalAddress = core.getBtcAddress(item.internalNode, 0, 'p2wpkh', network)
    item.dp = {external: bitcoinvault_external_path, internal: bitcoinvault_internal_path}
    
    if (!this.coins.hasOwnProperty('BTCV')) {
      this.coins.BTCV = {}
    }

    this.coins.BTCV[type] = item
    return item
  }
  
  /**
   * The method returns information about child nodes by the derivation path and range
   * @param {Object} data
   * @param {number} data.from - Top of the derivation range
   * @param {number} data.to - End of the derivation range
   * @param {string} data.path - Derivation path
   * @returns {{node: {privateExtendedKey: *, publicExtendedKey: *}, list: []}}
   */
  
  getChildNodes (data = {}) {
    const types = ['p2pkh', 'p2wpkh']
    let {from, to, path, coins} = data
    
    from = +from
    to = +to
    
    if (!Number.isInteger(from) || !Number.isInteger(to) || from > to) {
      throw new CustomError('err_core_derivation_range')
    }
    
    try {
      const node = core.derive(this.hdkey, path)
      
      let info = {
        node: {
          privateExtendedKey: node.privateExtendedKey,
          publicExtendedKey: node.publicExtendedKey
        },
        list: []
      }
      
      for (let i = from; i <= to; i++) {
        const child = {}
        const deriveChild = node.deriveChild(i)
        child.path = `${ path }/${ i }`
        child.privateKey = core.privateKeyToWIF(deriveChild.privateKey)
        child.publicKey = deriveChild.publicKey.toString('hex')
        for (let item of coins) {
          let {coin, type} = item

          switch (coin) {
            case 'BTC':
              if (!types.includes(type)) continue
              child[`${type}Address`] = core.getBtcAddress(node, i, type, 'btc')
              break
            case 'BCH':
              if (!child.p2pkhAddress) {
                child.p2pkhAddress = core.getBtcAddress(node, i, 'p2pkh', 'btc')
              }
              child.bchAddress = core.getCashAddress(child.p2pkhAddress)
              break
            case 'BTCV':
              child.btcvAddress = core.getBtcAddress(node, i, 'p2wpkh', 'btcv')
              break
            case 'ETH':
              child.ethAddress = core.getEthAddressByNode(deriveChild)
              break
          }
        }
        info.list.push(child)
      }
      
      return info
    }
    catch (e) {
      throw new CustomError('err_core_derivation')
    }
  }
  
  /**
   * Checking the mnemonic for validity
   * @param mnemonic
   * @returns {boolean}
   */
  
  checkMnemonic (mnemonic) {
    let words = mnemonic.split(' ')
    let withTypo = []
    
    words.forEach((word, index) => {
      if (!checkWords(word, 'english')) {
        withTypo.push(index)
      }
    })
    
    if (withTypo.length) {
      throw new CustomError('err_core_mnemonic')
    }
    
    return validateMnemonic(mnemonic)
  }
  
  /**
   * Getting the entropy size by the number of words in a mnemonic
   * @param words
   * @returns {number} Bits of entropy
   * @private
   */
  
  _getEntropyLength (words) {
    let bitsOfEntropy = {
      12: 128,
      15: 160,
      18: 192,
      21: 224,
      24: 256
    }
    
    if (!bitsOfEntropy.hasOwnProperty(+words)) {
      throw new CustomError('err_core_7')
    }
    
    return bitsOfEntropy[words]
  }
  
  get DATA () {
    return {
      mnemonic: this.mnemonic,
      xprv: this.xprv,
      from: this.from,
      hdkey: this.hdkey,
      seed: this.seed,
      seedInHex: this.seed ? this.seed.toString('hex') : null
    }
  }
  
  get COINS () {
    return {
      ...this.coins
    }
  }
}
