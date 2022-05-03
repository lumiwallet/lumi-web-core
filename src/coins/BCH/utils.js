import * as bchaddr from 'bchaddrjs'
import * as bitcore from 'bitcore-lib-cash'
import CustomError from '@/helpers/handleErrors'

/**
 * Getting Bitcoin Cash address by node and derivation index
 * @param {Object} node - Input data for a transaction
 * @param {number} childIndex - Derivation index
 * @param {boolean} withoutPrefix - Flag for prefix
 * @returns {string} Returns address
 */

export function getCashAddress(node, childIndex, withoutPrefix = true) {
  try {
    let pubKey = node.deriveChild(childIndex).pubKeyHash
    let address = new bitcore.Address.fromPublicKeyHash(pubKey)
    return address.toCashAddress(withoutPrefix)
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

export function convertToCashAddress(address = '') {
  try {
    const toCashAddress = bchaddr.toCashAddress

    return toCashAddress(address)
  }
  catch (e) {
    console.log(e)
    throw new CustomError('err_get_bch_address')
  }
}
