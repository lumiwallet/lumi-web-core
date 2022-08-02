import {LTC_PATH} from '@/helpers/configs/hd-paths'
import {derive} from '@/helpers/core'
import {getLtcAddress} from './utils'

/**
 * Creating a core for Litecoin.
 * At the output, we get a external and internal node,
 * derivation path and the first addresses of the external and internal cores
 *
 * @param {string} hdkey - A hierarchical deterministic key
 */
export function generateLtcCore (hdkey) {
  const litecoin_external_path = LTC_PATH + `/0`
  const litecoin_internal_path = LTC_PATH + `/1`

  let item = {}
  let externalNode = derive(hdkey, litecoin_external_path)
  let internalNode = derive(hdkey, litecoin_internal_path)
  item.externalNode = externalNode.privateExtendedKey
  item.internalNode = internalNode.privateExtendedKey
  item.externalAddress = getLtcAddress(externalNode, 0)
  item.internalAddress = getLtcAddress(internalNode, 0)
  externalNode = internalNode = null

  return item
}
