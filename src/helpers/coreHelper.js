import * as bip39 from 'bip39'
import * as bitcoin from 'bitcoinjs-lib'
import {Transaction} from 'ethereumjs-tx'
import * as ethUtil from 'ethereumjs-util'
import * as HDkey from 'hdkey'
import * as utils from 'web3-utils'
import wif from 'wif'
import * as bchaddr from 'bchaddrjs'
import * as bitcore from 'bitcore-lib-cash'
import CustomError from '@/helpers/handleErrors'
import {networks} from '@/helpers/networks'

/**
 * Generation of mnemonics.
 * The number of words in a mnemonic depends on the length of the entropy
 * @param {number} entropyLength - The number of bits in the entropy. It can be equal to 128, 160, 192, 224 or 256 bits
 * @returns {string} - A mnemonic whose words are separated by spaces
 */
export function generateMnemonic (entropyLength = 128) {
  try {
    return bip39.generateMnemonic(entropyLength)
  }
  catch (e) {
    console.log(e)
    throw new CustomError('err_core_entropy')
  }
}

/**
 * Converting a mnemonic to seed
 * @param {string} mnemonic - Mnemonic phrase
 * @returns {Buffer} - Seed in Uint8Array format
 */
export function mnemonicToSeed (mnemonic) {
  try {
    return bip39.mnemonicToSeedSync(mnemonic)
  }
  catch (e) {
    console.log(e)
    throw new CustomError('err_core_mnemonic')
  }
}

/**
 * Converting a mnemonic to entropy
 * @param {string} mnemonic - Mnemonic phrase
 * @returns {string} HEX strings entropy
 */
export function mnemonicToEntropy (mnemonic) {
  try {
    return bip39.mnemonicToEntropy(mnemonic)
  }
  catch (e) {
    console.log(e)
    throw new CustomError('err_core_mnemonic')
  }
}

/**
 * Converting a seed to hdkey (Hierarchical Deterministic Key)
 * @param {Buffer} seed - Mnemonic seed in Buffer
 * @returns {Object} hdkey object with private and public key
 */
export function hdFromSeed (seed) {
  try {
    return HDkey.fromMasterSeed(seed)
  }
  catch (e) {
    console.log(e)
    throw new CustomError('err_core_seed')
  }
}


/**
 * Converting a xprv to hdkey (Hierarchical Deterministic Key)
 * @param {string} xprv - Extended private key
 * @returns {Object} hdkey object with private and public key
 */
export function hdFromXprv (xprv) {
  try {
    return HDkey.fromExtendedKey(xprv)
  }
  catch (e) {
    console.log(e)
    throw new CustomError('err_core_xprv')
  }
}

/**
 * Getting xprv by hdkey
 * @param {Object} hd - HDkey node
 * @returns {string} Extended private key
 */
export function getXprv (hd) {
  try {
    return hd.privateExtendedKey
  }
  catch (e) {
    console.log(e)
    throw new CustomError('err_core_hdkey')
  }
}

/**
 * Derivation of node. Getting child node by path
 * @param {Object} hd - HDkey node
 * @param {string} path - Derivation path
 * @returns {Object} - Child node
 */

export function derive (hd, path) {
  if (!hd) {
    throw new CustomError('err_core_derivation_hdkey')
  }
  
  if (!path) {
    throw new CustomError('err_core_derivation_path')
  }
  let regex = new RegExp(/(^m\/\d+\')([\/{1}\d+\'{1}]+)/mg)
  
  if (!regex.test(path)) {
    throw new CustomError('err_core_derivation_path')
  }
  
  try {
    return hd.derive(path)
  }
  catch (e) {
    console.log(e)
    throw new CustomError('err_core_derivation')
  }
}

/**
 * Getting a bitcoin address by node and child index
 * @param {Object} node - HDkey node
 * @param {number} childIndex - Index of the child node
 * @param {string} type - Bitcoin type. There may be p2pkh or p2wpkh
 * @param {string} network - Custom network for different coins
 * @returns {string} Bitcoin address
 */

export function getBtcAddress (node, childIndex = 0, type = 'p2pkh', network = 'btc') {
  const types = ['p2pkh', 'p2wpkh']
  
  if (!types.includes(type)) {
    throw new CustomError('err_core_btc_type')
  }
  
  try {
    let pubKey = node.deriveChild(childIndex).publicKey
    
    return bitcoin.payments[type]({
      pubkey: pubKey,
      network: networks[network] || network.btc
    }).address
  }
  catch (e) {
    console.log(e)
    throw new CustomError('err_core_btc_address')
  }
}

/**
 * Getting an address by public key
 * @param {string} key - Coin public key
 * @param {string} type - Bitcoin type. There may be p2pkh or p2wpkh
 * @param {string} network - Custom network for different coins
 * @returns {string} Bitcoin address
 */

export function getBtcAddressByPublicKey (key, type = 'p2pkh', network = 'btc') {
  if (!key) return ''
  
  try {
    return bitcoin.payments[type]({
      pubkey: new Buffer(key, 'hex'),
      network: networks[network]
    }).address
  }
  catch (e) {
    console.log(e)
    throw new CustomError('err_core_btc_address')
  }
  
}

/**
 * Getting a Ethereum private key by node
 * @param {Object} node - Ethereum node
 * @returns {Buffer} Ethereum private key in Uint8Array format
 */

export function getEthPrivateKey (node) {
  try {
    return node._privateKey
  }
  catch (e) {
    console.log(e)
    throw new CustomError('err_core_eth_node')
  }
}

/**
 * Getting a Ethereum public key by private key
 * @param {Buffer} privateKey - Ethereum private key
 * @returns {Buffer} Ethereum public key in Uint8Array format
 */

export function getEthPublicKey (privateKey) {
  try {
    return ethUtil.privateToPublic(privateKey)
  }
  catch (e) {
    console.log(e)
    throw new CustomError('err_core_eth_private_key')
  }
}

/**
 * Getting a Ethereum wallet address by public key
 * @param {Buffer} publicKey - Ethereum public key
 * @returns {string} Ethereum wallet address
 */

export function getEthAddress (publicKey) {
  try {
    let addrBuffer = ethUtil
      .publicToAddress(publicKey)
      .toString('hex')
    return ethUtil.toChecksumAddress(addrBuffer).toLowerCase()
  }
  catch (e) {
    console.log(e)
    throw new CustomError('err_core_eth_public_key')
  }
}

/**
 * Getting Ethereum wallet address by node
 * @param {Object} node - Ethereum node
 * @returns {string} Ethereum wallet address
 */

export function getEthAddressByNode (node) {
  try {
    let privateKey = getEthPrivateKey(node)
    let publicKey = getEthPublicKey(privateKey)
    return getEthAddress(publicKey)
  }
  catch (e) {
    console.log(e)
    throw new CustomError('err_core_eth_public_key')
  }
}

/**
 * Convert a Bitcoin private key to the WIF (Wallet Import Format)
 * @param {Buffer} privateKey - Private key in Uint8Array format
 * @returns {string} Private key in WIF
 */
export function privateKeyToWIF (privateKey) {
  try {
    return wif.encode(128, privateKey, true)
  }
  catch (e) {
    throw new CustomError('err_core_private_key')
  }
}

/**
 * Calculating the transaction size by the number of inputs and outputs
 * @param {number} i - Number of inputs. By default 1
 * @param {number} o - Number of outputs. By default 2
 * @param {boolean} isWitness - Flag signaling that there is a witness in the transaction
 * @returns {number} Transaction size
 */

export function calcBtcTxSize (i = 1, o = 2, isWitness = false) {
  let result = 0
  
  if (isWitness) {
    let base_size = (41 * i) + (32 * o) + 10
    let total_size = (149 * i) + (32 * o) + 12
    
    result = ((3 * base_size) + total_size) / 4
  } else {
    result = i * 148 + o * 34 + 10
  }
  
  return Math.ceil(result)
}

/**
 * Creating a raw Bitcoin transaction
 * @param {Object} data - Input data for a transaction
 * @param {Array} data.inputs - List of inputs
 * @param {Array} data.outputs - List of outputs
 * @returns {Object} Returns raw Bitcoin transaction and transaction hash
 */

export function makeRawBtcTx (data = {}) {
  try {
    const {inputs, outputs} = data
    const psbt = new bitcoin.Psbt()
    let keyPairs = []
    
    psbt.setVersion(1)
    
    inputs.forEach(input => {
      const isSegwit = input.address.substring(0, 3) === 'bc1'
      const keyPair = bitcoin.ECPair.fromWIF(input.key)
      
      keyPairs.push(keyPair)
      
      let data = {
        hash: input.hash,
        index: input.index
      }
      
      if (isSegwit) {
        const p2wpkh = bitcoin.payments.p2wpkh({pubkey: keyPair.publicKey})
        const script = p2wpkh.output.toString('hex')
        
        data.witnessUtxo = {
          script: Buffer.from(script, 'hex'),
          value: input.value
        }
      } else {
        data.nonWitnessUtxo = Buffer.from(input.tx, 'hex')
      }
      psbt.addInput(data)
    })
    
    outputs.forEach(output => {
      psbt.addOutput({
        address: output.address,
        value: output.value
      })
    })
    
    keyPairs.forEach((key, i) => {
      psbt.signInput(i, key)
    })
    
    psbt.validateSignaturesOfAllInputs()
    psbt.finalizeAllInputs()
    
    const transaction = psbt.extractTransaction()
    const signedTransaction = transaction.toHex()
    const hash = transaction.getId()
    
    return {
      hash,
      tx: signedTransaction
    }
  }
  catch (e) {
    console.log(e)
    throw new CustomError('err_tx_btc_build')
  }
}

/**
 * Creating a raw Bitcoin Vault transaction
 * @param {Object} data - Input data for a transaction
 * @param {Array} data.inputs - List of inputs
 * @param {Array} data.outputs - List of outputs
 * @returns {Object} Returns raw Bitcoin Vault transaction and transaction hash
 */

export function makeRawBtcvTx (data = {}) {
  try {
    const {inputs, outputs} = data
    const psbt = new bitcoin.Psbt({network: networks.btcv})
    let keyPairs = []
    psbt.setVersion(1)
    
    inputs.forEach(input => {
      const keyPair = bitcoin.ECPair.fromWIF(input.key, networks.btcv)
      
      keyPairs.push(keyPair)
      
      let data = {
        hash: input.hash,
        index: input.index
      }
      
      
      const p2wpkh = bitcoin.payments.p2wpkh({pubkey: keyPair.publicKey, network: networks.btcv})
      const script = p2wpkh.output.toString('hex')
      
      data.witnessUtxo = {
        script: Buffer.from(script, 'hex'),
        value: input.value
      }
      
      psbt.addInput(data)
    })
    
    outputs.forEach(output => {
      psbt.addOutput({
        address: output.address,
        value: output.value
      })
    })
    
    keyPairs.forEach((key, i) => {
      psbt.signInput(i, key)
    })
    
    psbt.validateSignaturesOfAllInputs()
    psbt.finalizeAllInputs()
    
    const transaction = psbt.extractTransaction()
    const signedTransaction = transaction.toHex()
    const hash = transaction.getId()
    
    return {
      hash,
      tx: signedTransaction
    }
  }
  catch (e) {
    console.log(e)
    throw new CustomError('err_tx_btc_build')
  }
}

/**
 * Creating a raw Ethereum transaction
 * @param {Object} data - Input data for a transaction
 * @param {string} data.to - Recipient address or contract address
 * @param {number} data.value - Transaction amount
 * @param {number} data.nonce - Nonce, transaction count of an account
 * @param {number} data.gasPrice - Transaction gas price
 * @param {number} data.gasLimit - Transaction gas limit
 * @param {string} data.from - Ethereum sender address (required for ERC20 transactions)
 * @param {string} data.data - Data in hex representation (required for ERC20 transactions)
 * @param {string|Buffer} data.privateKey - Ethereum private key in hex or Buffer format
 * @returns {Object} Returns raw Ethereum transaction and transaction hash
 */

export function makeRawEthTx (data = {}) {
  const {to, value, nonce, gasPrice, gasLimit, privateKey, chainId} = data
  
  if (isNaN(nonce) || isNaN(value) || isNaN(gasPrice) ||
    isNaN(gasLimit)) {
    throw new CustomError('err_tx_eth_invalid_params')
  }
  
  if (typeof to !== 'string') {
    throw new CustomError('err_tx_eth_invalid_params_string')
  }
  
  try {
    let params = {
      to: to,
      nonce: utils.toHex(parseInt(nonce)),
      value: utils.toHex(parseInt(value)),
      gasPrice: utils.toHex(parseInt(gasPrice)),
      gasLimit: utils.toHex(parseInt(gasLimit)),
      chainId: utils.toHex(1)
    }
    
    if (data.hasOwnProperty('from') && data.from) {
      params.from = data.from
    }
    
    if (data.hasOwnProperty('data') && data.data) {
      params.data = data.data
    }
    
    const tx = new Transaction(params)
    const privateKeyBuffer = ethUtil.toBuffer(privateKey)
    
    tx.sign(privateKeyBuffer)
    
    const serializedTx = tx.serialize()
    const hash = tx.hash().toString('hex')
    
    return {
      hash: `0x${ hash }`,
      tx: `0x${ serializedTx.toString('hex') }`
    }
  }
  catch (e) {
    console.log(e)
    throw new CustomError('err_tx_eth_build')
  }
}

/**
 * Creating a raw Bitcoin Cash transaction
 * @param {Object} data - Input data for a transaction
 * @param {Array} data.inputs - List of inputs
 * @param {Array} data.outputs - List of outputs
 * @returns {Object} Returns raw Bitcoin Cash transaction and transaction hash
 */

export function makeRawBchTx (data = {}) {
  try {
    const {inputs, outputs} = data
    let privateKeys = []
    let utxos = []
    
    for (let input of inputs) {
      let item = {
        outputIndex: +input.index,
        satoshis: +input.value,
        address: convertToCashAddress(input.address),
        txId: input.hash
      }
      item.script = new bitcore.Script.buildPublicKeyHashOut(item.address)
      privateKeys.push(input.key)
      utxos.push(item)
    }
    
    const outputsInCashFormat = outputs.map(output => {
      return {
        address: convertToCashAddress(output.address),
        satoshis: +output.value
      }
    })
    
    const tx = new bitcore.Transaction()
      .from(utxos)
      .to(outputsInCashFormat)
      .sign(privateKeys)
    
    const txData = tx.serialize()
    
    return {
      tx: txData.toString('hex'),
      hash: tx.hash
    }
  }
  catch (e) {
    console.log(e)
    throw new CustomError('err_tx_bch_build')
  }
}

/**
 * Getting Bitcoin Cash address by node and derivation index
 * @param {Object} node - Input data for a transaction
 * @param {number} childIndex - Derivation index
 * @returns {string} Returns address
 */

export function getCashAddress (node, childIndex) {
  try {
    let pubKey = node.deriveChild(childIndex).pubKeyHash
    let address = new bitcore.Address.fromPublicKeyHash(pubKey)
    return address.toCashAddress(true)
  }
  catch (e) {
    console.log(e)
    throw new CustomError('err_core_bch_address')
  }
}

/**
 * Convert a Bitcoin Cash address from Legacy format to CashAddr format
 * @param {string} address - Bitcoin Cash address in Legacy format
 * @returns {string} Returns Bitcoin Cash address in CashAddr format
 */

export function convertToCashAddress (address = '') {
  try {
    const toCashAddress = bchaddr.toCashAddress
    
    return toCashAddress(address)
  }
  catch (e) {
    console.log(e)
    throw new CustomError('err_get_bch_address')
  }
}

/**
 * Getting Bitcoin private key for address by derivation index
 * @param {Object} node - Input data for a transaction
 * @param {number} index - Derivation index
 * @returns {string} Returns Private key in WIF format
 */

export function getBtcPrivateKeyByIndex (node, index) {
  try {
    const key = node.deriveChild(index).privateKey
    
    return privateKeyToWIF(key)
  }
  catch (e) {
    throw new CustomError('err_btc_private_key_by_index')
  }
}
