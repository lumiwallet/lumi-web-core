import {derive}            from '@/helpers/core'
import {toChecksumAddress} from './utils'
import * as utils          from './utils'

/**
 * Creating a core for Ethereum.
 * At the output, we get a Ethereum node, derivation path,
 * a private and public key, and the Ethereum address
 *
 * @param {string} hdkey - A hierarchical deterministic key
 * @param {number} type - Ethereum account number. By default 0
 * @private
 */

export function generateEthCore (hdkey, type = 0, checksumAddress = false) {
  if (!Number.isInteger(type)) {
    type = 0
  }

  const ethereum_path = `m/44'/60'/${ type }'/0/0`
  let item = {}

  item.node = derive(hdkey, ethereum_path)
  item.privateKey = utils.getEthPrivateKey(item.node)
  item.privateKeyHex = '0x' + item.privateKey.toString('hex')
  item.publicKey = utils.getEthPublicKey(item.privateKey)
  item.externalAddress = utils.getEthAddress(item.publicKey)
  if (checksumAddress) {
    item.externalAddress = utils.toChecksumAddress(item.externalAddress)
  }
  // item.dp = ethereum_path

  return item
}
