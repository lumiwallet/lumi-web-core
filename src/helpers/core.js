import * as bip39 from 'bip39'
import * as HDkey from 'hdkey'
import wif from 'wif'
import CustomError from '@/helpers/handleErrors'

/**
 * Generation of mnemonics.
 * The number of words in a mnemonic depends on the length of the entropy
 * @param {number} entropyLength - The number of bits in the entropy. It can be equal to 128, 160, 192, 224 or 256 bits
 * @returns {string} - A mnemonic whose words are separated by spaces
 */
export function generateMnemonic(entropyLength = 128) {
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
export function mnemonicToSeed(mnemonic) {
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
export function mnemonicToEntropy(mnemonic) {
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
export function hdFromSeed(seed) {
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
export function hdFromXprv(xprv) {
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
export function getXprv(hd) {
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

export function derive(hd, path) {
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
 * Convert a Bitcoin private key to the WIF (Wallet Import Format)
 * @param {Buffer} privateKey - Private key in Uint8Array format
 * @returns {string} Private key in WIF
 */
export function privateKeyToWIF(privateKey) {
  try {
    return wif.encode(128, privateKey, true)
  }
  catch (e) {
    throw new CustomError('err_core_private_key')
  }
}
