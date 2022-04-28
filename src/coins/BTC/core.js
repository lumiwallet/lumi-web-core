import {BTC_PATH} from '@/helpers/config'
import {derive} from '@/helpers/core'
import {getBtcAddress} from './utils'

/**
 * Creating a core for Bitcoin.
 * At the output, we get a external and internal node,
 * derivation path and the first addresses of the external and internal cores
 *
 * @param {string} type - Bitcoin type. There may be p2pkh or p2wpkh
 * @private
 */

export function generateBtcCore (hdkey, type = 'p2pkh') {
  if (!(type in BTC_PATH)) {
    throw new CustomError('err_core_btc_type')
  }

  const bitcoin_external_path = BTC_PATH[type] + '/0'
  const bitcoin_internal_path = BTC_PATH[type] + '/1'

  let item = {}
  item.externalNode = derive(hdkey, bitcoin_external_path)
  item.internalNode = derive(hdkey, bitcoin_internal_path)
  item.externalAddress = getBtcAddress(item.externalNode, 0, type)
  item.internalAddress = getBtcAddress(item.internalNode, 0, type)
  // item.dp = {
  //   external: bitcoin_external_path,
  //   internal: bitcoin_internal_path
  // }

  return item
}
