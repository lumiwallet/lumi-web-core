import {derive} from '@/helpers/core'
import {BCH_PATH} from '@/helpers/config'
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
  item.externalNode = derive(hdkey, bitcoincash_external_path)
  item.internalNode = derive(hdkey, bitcoincash_internal_path)
  item.externalAddress = getBtcAddress(item.externalNode, 0)
  item.internalAddress = getBtcAddress(item.internalNode, 0)
  // item.dp = {external: bitcoincash_external_path, internal: bitcoincash_internal_path}

  return item
}
