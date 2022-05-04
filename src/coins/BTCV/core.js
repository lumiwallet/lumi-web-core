import {BTCV_PATH} from '@/helpers/configs/hd-paths'
import {derive} from '@/helpers/core'
import {getBtcAddress} from '@/coins/BTC/utils'

/**
 * Creating a core for Bitcoin Vault.
 * At the output, we get a external and internal node,
 * derivation path and the first addresses of the external and internal cores
 * @param {string} hdkey - A hierarchical deterministic key
 *
 * @private
 */

export function generateBtcvCore (hdkey) {
  const network = 'btcv'
  const type = 'p2wpkh'
  const bitcoinvault_external_path = BTCV_PATH + `/0`
  const bitcoinvault_internal_path = BTCV_PATH+ `/1`

  let item = {}
  let externalNode = derive(hdkey, bitcoinvault_external_path)
  let internalNode = derive(hdkey, bitcoinvault_internal_path)
  item.externalNode = externalNode.privateExtendedKey
  item.internalNode = internalNode.privateExtendedKey
  item.externalAddress = getBtcAddress(externalNode, 0, type, network)
  item.internalAddress = getBtcAddress(internalNode, 0, type, network)

  return item
}
