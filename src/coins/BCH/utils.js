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

export function getBchAddressByPublicKey(pubKey, withoutPrefix = true) {
  if (!pubKey) return ''

  try {
    const bitcorePubKey = new bitcore.PublicKey(pubKey)
    let address = new bitcore.Address.fromPublicKey(bitcorePubKey)
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

/**
 * Creating a raw Bitcoin Cash transaction
 * @param {Object} data - Input data for a transaction
 * @param {Array} data.inputs - List of inputs
 * @param {Array} data.outputs - List of outputs
 * @returns {Object} Returns raw Bitcoin Cash transaction and transaction hash
 */

export function makeRawBchTx(data = {}) {
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
      let pk = new bitcore.PrivateKey(input.key)
      privateKeys.push(pk)
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
