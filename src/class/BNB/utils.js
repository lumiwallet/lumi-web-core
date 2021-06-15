import bigDecimal from 'js-big-decimal'
import ecc from 'tiny-secp256k1'
import {sha256} from '@/utils/crypto'

export const convertToJager = (amount) => {
  if (!amount || isNaN(+amount)) return 0
  const jager = bigDecimal.multiply(amount, Math.pow(10, 8))
  return +bigDecimal.floor(jager)
}

export const convertToBinance = (amount) => {
  if (!amount || isNaN(+amount)) return 0
  
  return +bigDecimal.divide(amount, Math.pow(10, 8))
}

export const generateSignature = (signBytesHex, privateKey) => {
  const msgHash = sha256(signBytesHex)
  const msgHashHex = Buffer.from(msgHash, 'hex')
  return ecc.sign(
    msgHashHex,
    Buffer.from(privateKey, 'hex')
  )
}
