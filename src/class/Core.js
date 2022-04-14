import {validateMnemonic} from 'bip39'
import CryptoJS, {SHA256} from 'crypto-js'
import {normalize, checkWords} from '@/libs/bip39-checker'
import CustomError from '@/helpers/handleErrors'
import * as core from '@/helpers/core'
import {ETH_PATH} from '@/helpers/config'
import * as ETH_UTILS from '@/coins/ETH/utils'
export {core as coreUtils}

export const createCoreByMnemonic = (mnemonic) => {
  let normalize_mnemonic = normalize(mnemonic)
  if (!checkMnemonic(normalize_mnemonic)) {
    throw new CustomError('err_core_mnemonic')
  }
  let seed = core.mnemonicToSeed(normalize_mnemonic)
  let hdkey = core.hdFromSeed(seed)
  let xprv = core.getXprv(hdkey)
  let id = getWalletId(hdkey)
  seed = null
  hdkey = null

  return {
    mnemonic: normalize_mnemonic,
    xprv,
    id
  }
}

export const createMnemonic = (wordsCount = 12) => {
  const entropy = getEntropyLength(wordsCount)
  let mnemonic = core.generateMnemonic(entropy)

  return mnemonic
}

export const checkMnemonic = (mnemonic) => {
  let normalize_mnemonic = normalize(mnemonic)
  let words = normalize_mnemonic.split(' ')
  let withTypo = []

  words.forEach((word, index) => {
    if (!checkWords(word, 'english')) {
      withTypo.push(index)
    }
  })
  if (withTypo.length) {
    throw new CustomError('err_core_mnemonic')
  }
  return validateMnemonic(normalize_mnemonic)
}

export const getWalletId = (hdkey) => {
  let ethNode = core.derive(hdkey, ETH_PATH)
  let privateKey = ETH_UTILS.getEthPrivateKey(ethNode)
  let publicKey = ETH_UTILS.getEthPublicKey(privateKey)
  let id = SHA256(CryptoJS.lib.WordArray.create(publicKey))
  ethNode = privateKey = publicKey = null
  return id.toString()
}

const getEntropyLength = (words) => {
  let bitsOfEntropy = {
    12: 128,
    15: 160,
    18: 192,
    21: 224,
    24: 256
  }

  if (!bitsOfEntropy.hasOwnProperty(+words)) {
    throw new CustomError('err_core_entropy')
  }

  return bitsOfEntropy[words]
}
