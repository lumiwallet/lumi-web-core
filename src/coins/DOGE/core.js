import {DOGE_PATH} from '@/helpers/configs/hd-paths'
import {derive} from '@/helpers/core'
import {getDogeAddress} from './utils'

/**
 * Creating a core for Dogecoin.
 * At the output, we get a external and internal node,
 * derivation path and the first addresses of the external and internal cores
 * @param {string} hdkey - A hierarchical deterministic key
 * @private
 */

export function generateDogeCore (hdkey) {
  const dogecoin_external_path = DOGE_PATH + `/0`
  const dogecoin_internal_path = DOGE_PATH + `/1`

  let item = {}
  let externalNode = derive(hdkey, dogecoin_external_path)
  let internalNode = derive(hdkey, dogecoin_internal_path)
  item.externalNode = externalNode.privateExtendedKey
  item.internalNode = internalNode.privateExtendedKey
  item.externalAddress = getDogeAddress(externalNode, 0)
  item.internalAddress = getDogeAddress(internalNode, 0)
  // item.dp = {external: dogecoin_external_path, internal: dogecoin_internal_path}
  externalNode = internalNode = null

  return item
}
