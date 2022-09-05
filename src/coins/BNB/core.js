import {getBnbAddressByPublicKey} from './address'
import {derive} from '@/helpers/core'
import {BNB_PATH} from '@/helpers/configs/hd-paths'

export function generateBnbCore (hdkey) {
  let item = {}
  let node = derive(hdkey, BNB_PATH)

  item.node = node.privateExtendedKey
  item.privateKey = node._privateKey.toString('hex')
  item.privateKeyHex = item.privateKey.toString('hex')
  item.publicKey = node._publicKey
  item.publicKeyHex = node._publicKey.toString('hex')
  item.externalAddress = getBnbAddressByPublicKey(item.publicKey.toString('hex'))
  node = null

  return item
}
