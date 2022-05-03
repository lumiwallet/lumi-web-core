import {derive} from '@/helpers/core'
import {BCH_PATH} from '@/helpers/configs/hd-paths'
import {getBtcAddress} from '@/coins/BTC/utils'

/**
 * Creating a core for Bitcoin Cash.
 * At the output, we get a external and internal node,
 * derivation path and the first addresses of the external and internal cores
 *
 * @param {Object} hdkey - HDkey node
 * @private
 */

export function generateBchCore (hdkey) {
  const bitcoincash_external_path = BCH_PATH + `/0`
  const bitcoincash_internal_path = BCH_PATH + `/1`

  let item = {}
  let externalNode = derive(hdkey, bitcoincash_external_path)
  let internalNode = derive(hdkey, bitcoincash_internal_path)
  item.externalNode = externalNode.privateExtendedKey
  item.internalNode = internalNode.privateExtendedKey
  item.externalAddress = getBtcAddress(externalNode, 0)
  item.internalAddress = getBtcAddress(internalNode, 0)
  // item.dp = {external: bitcoincash_external_path, internal: bitcoincash_internal_path}
  externalNode = internalNode = null

  return item
}
