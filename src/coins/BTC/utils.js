import * as bitcoin from 'bitcoinjs-lib'
import {networks} from '@/helpers/networks'

/**
 * Getting a bitcoin address by node and child index
 * @param {Object} node - HDkey node
 * @param {number} childIndex - Index of the child node
 * @param {string} type - Bitcoin type. There may be p2pkh or p2wpkh
 * @param {string} network - Custom network for different coins
 * @returns {string} Bitcoin address
 */

export function getBtcAddress(node, childIndex = 0, type = 'p2pkh', network = 'btc') {
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

export function getBtcAddressByPublicKey(key, type = 'p2pkh', network = 'btc') {
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
 * Getting Bitcoin private key for address by derivation index
 * @param {Object} node - Input data for a transaction
 * @param {number} index - Derivation index
 * @returns {string} Returns Private key in WIF format
 */

export function getBtcPrivateKeyByIndex(node, index) {
  try {
    const key = node.deriveChild(index).privateKey

    return privateKeyToWIF(key)
  }
  catch (e) {
    throw new CustomError('err_btc_private_key_by_index')
  }
}
