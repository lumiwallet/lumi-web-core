import {derive} from '@/helpers/core'
import * as utils from './utils'

export function generateEthCore (hdkey, type = 0) {
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
  // item.dp = ethereum_path

  return item
}
