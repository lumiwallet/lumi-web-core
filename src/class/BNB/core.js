import {getAddressFromPublicKey} from '@/class/BNB/address'
import {derive} from '@/helpers/coreHelper'

const bnb_path = `m/44'/714'/0'/0/0`

export function getBnbCore (hdkey) {
  let item = {}
  item.node = derive(hdkey, bnb_path)
  item.privateKey = item.node._privateKey
  item.privateKeyHex = '0x' + item.privateKey.toString('hex')
  item.publicKey = item.node._publicKey
  item.externalAddress = getAddressFromPublicKey(item.publicKey.toString('hex'))
  item.dp = bnb_path
  
  return item
}
