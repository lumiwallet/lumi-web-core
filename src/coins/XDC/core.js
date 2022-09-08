import {XDC_PATH} from '@/helpers/configs/hd-paths'
import {derive} from '@/helpers/core'
import {getEthPrivateKey, getEthPublicKey, getEthAddress} from '@/coins/ETH/utils'
/**
 * Creating a core for XinFin Network.
 * At the output, we get a XinFin node, derivation path,
 * a private and public key, and the Ethereum address
 * @param {string} hdkey - A hierarchical deterministic key
 */

export function generateXdcCore (hdkey) {
  let item = {}

  item.node = derive(hdkey, XDC_PATH)
  item.privateKey = getEthPrivateKey(item.node)
  item.privateKeyHex = '0x' + item.privateKey.toString('hex')
  item.publicKey = getEthPublicKey(item.privateKey)
  item.externalAddress = getEthAddress(item.publicKey).replace('0x', 'xdc')

  return item
}
