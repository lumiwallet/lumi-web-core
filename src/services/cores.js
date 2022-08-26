import {generateBtcCore} from '@/coins/BTC/core'
import {generateEthCore} from '@/coins/ETH/core'
import {generateBchCore} from '@/coins/BCH/core'
import {generateDogeCore} from '@/coins/DOGE/core'
import {generateLtcCore} from '@/coins/LTC/core'
import {generateXdcCore} from '@/coins/XDC/core'
import {generateBtcvCore} from '@/coins/BTCV/core'
import {generateBnbCore} from '@/coins/BNB/core'
import * as PATH from '@/helpers/configs/hd-paths'
import {derive, hdFromXprv} from '@/helpers/core'

import {getBtcAddressByPublicKey} from '@/coins/BTC/utils'
import {getBchAddressByPublicKey} from '@/coins/BCH/utils'
import {getDogeAddressBuyPublicKey} from '@/coins/DOGE/utils'
import {getLtcAddressBuyPublicKey} from '@/coins/LTC/utils'

const addressMethod = {
  'BTC': (pubKey, addressType) => getBtcAddressByPublicKey(pubKey, addressType),
  'BTCV': (pubKey) => getBtcAddressByPublicKey(pubKey, 'p2wpkh', 'btcv'),
  'BCH': (pubKey) => getBchAddressByPublicKey(pubKey),
  'DOGE': (pubKey) => getDogeAddressBuyPublicKey(pubKey),
  'LTC': (pubKey) => getLtcAddressBuyPublicKey(pubKey)
}

function createCoinsCores(hdkey, coins = []) {
  let core = {}

  for (let item of coins) {
    const {coin, type} = item
    if (!core.hasOwnProperty(coin)) {
      core[coin] = {}
    }

    switch (coin) {
      case 'BTC':
        core[coin][type] = generateBtcCore(hdkey, type)
        break
      case 'ETH':
        core[coin] = generateEthCore(hdkey, type)
        break
      case 'BCH':
        core[coin] = generateBchCore(hdkey)
        break
      case 'DOGE':
        core[coin] = generateDogeCore(hdkey)
        break
      case 'BTCV':
        core[coin] = generateBtcvCore(hdkey)
        break
      case 'XDC':
        core[coin] = generateXdcCore(hdkey)
        break
      case 'LTC':
        core[coin] = generateLtcCore(hdkey)
        break
      case 'BNB':
        core[coin] = generateBnbCore(hdkey)
        break
      case '@G':
        core[coin] = generateEthCore(hdkey, 0, true)
        break
    }
  }

  return core
}

function createCoreWithAddresses({
  xprv = '',
  coin = '',
  addressType = '',
  pathType = 0,
  from = 0,
  to = 20
}) {
  const pathName = `${ coin }_PATH`
  let path = PATH[pathName] ? (PATH[pathName][addressType] ? PATH[pathName][addressType] : PATH[pathName]) : null

  if (!path) {
    throw Error('Currency not supported')
  }
  path += '/' + pathType

  if (!xprv) {
    throw Error('xprv is undefined')
  }

  let hdkey = hdFromXprv(xprv)
  let node = derive(hdkey, path)
  const info = {
    node: {
      privateExtendedKey: node.privateExtendedKey,
      publicExtendedKey: node.publicExtendedKey
    },
    list: []
  }

  const addressFn = addressMethod[coin]

  for (let i = from; i <= to; i++) {
    const child = {}
    const deriveChild = node.deriveChild(i)
    child.path = `${ path }/${ i }`
    child.privateKey = deriveChild.privateKey.toString('hex')
    // child.privateKey = core.privateKeyToWIF(deriveChild.privateKey)
    const publicKey = deriveChild.publicKey
    child.publicKey = publicKey.toString('hex')
    child.address = addressFn(publicKey, addressType)
    info.list.push(child)
  }
  hdkey = node = null

  return info
}


export {
  createCoinsCores,
  createCoreWithAddresses,
  generateBtcCore,
  generateEthCore,
  generateBchCore,
  generateDogeCore,
  generateBtcvCore,
  generateLtcCore,
  generateXdcCore
}
