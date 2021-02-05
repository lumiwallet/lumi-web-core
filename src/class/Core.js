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
    this.config = {
      BTC: ['p2pkh', 'p2wpkh'],
      ETH: [0],
      BCH: ['p2pkh']
    }
    this.BTC = {}
    this.ETH = {}
    this.BCH = {}
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
    
    
    await this.generateCurrenciesCore(this.config)
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
  
  
  async generateCurrenciesCore (config = {}) {
    for (let coin in config) {
      for (let item of config[coin]) {
        switch (coin) {
          case 'BTC':
            await this._generateBTCcore(item)
            break
          case 'ETH':
            await this._generateETHcore(item)
            break
          case 'BCH':
            await this._generateBCHcore(item)
            break
        }
      }
    }
  }
  
  /**
   * Creating a core for Bitcoin.
   * At the output, we get a external and internal node
   * and the first address of the external core
   * @private
   */
  
  _generateBTCcore (type = 'p2pkh') {
    const bitcoin_paths = {
      p2pkh: `m/44'/0'/0'`,
      p2wpkh: `m/84'/0'/0'`
    }
    if (!(type in bitcoin_paths)) {
      // TODO throw error
    }
    const bitcoin_external_path = bitcoin_paths[type] + '/0'
    const bitcoin_internal_path = bitcoin_paths[type] + '/1'
    
    this.BTC[type] = {}
    this.BTC[type].externalNode = core.derive(this.hdkey, bitcoin_external_path)
    this.BTC[type].internalNode = core.derive(this.hdkey, bitcoin_internal_path)
    this.BTC[type].address = core.getBtcAddress(this.BTC[type].externalNode, 0, type)
    this.BTC[type].dp = {
      external: bitcoin_external_path,
      internal: bitcoin_internal_path
    }
  }
  
  /**
   * Creating a core for Ethereum.
   * At the output, we get a Ethereum node,
   * a private and public key, and the Ethereum address
   * @private
   */
  
  _generateETHcore (account = 0) {
    if (Number.isInteger(account)) {
      // TODO throw error
    }
    const ethereum_path = `m/44'/60'/${ account }'/0/0`
    
    this.ETH[account] = {}
    this.ETH[account].node = core.derive(this.hdkey, ethereum_path)
    this.ETH[account].privateKey = core.getEthPrivateKey(this.ETH[account].node)
    this.ETH[account].privateKeyHex = '0x' + this.ETH[account].privateKey.toString('hex')
    this.ETH[account].publicKey = core.getEthPublicKey(this.ETH[account].privateKey)
    this.ETH[account].address = core.getEthAddress(this.ETH[account].publicKey)
    this.ETH[account].dp = ethereum_path
  }
  
  /**
   * Creating a core for Bitcoin Cash.
   * At the output, we get a external and internal node
   * and the first address of the external core
   * @private
   */
  
  _generateBCHcore (type) {
    if (!type) {
      // TODO throw error
    }
    const bitcoincash_external_path = 'm/44\'/145\'/0\'/0'
    const bitcoincash_internal_path = 'm/44\'/145\'/0\'/1'
    
    this.BCH[type] = {}
    this.BCH[type].externalNode = core.derive(this.hdkey, bitcoincash_external_path)
    this.BCH[type].internalNode = core.derive(this.hdkey, bitcoincash_internal_path)
    this.BCH[type].address = core.getBtcAddress(this.BCH[type].externalNode, 0)
    this.BCH[type].dp = {external: bitcoincash_external_path, internal: bitcoincash_internal_path}
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
    let {from, to, path} = data
    
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
        child.p2pkhAddress = core.getBtcAddress(node, i, 'p2pkh')
        child.p2wpkhAddress = core.getBtcAddress(node, i, 'p2wpkh')
        child.ethAddress = core.getEthAddressByNode(deriveChild)
        child.bchAddress = core.getCashAddress(child.p2pkhAddress)
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
      seedInHex: this.seed ? this.seed.toString('hex') : null,
      BTC: this.BTC,
      ETH: this.ETH,
      BCH: this.BCH
    }
  }
}
