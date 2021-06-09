import bech32 from 'bech32'
import * as crypto from '@/utils/crypto'
import { ec as EC } from "elliptic"

const CURVE = "secp256k1"
const ec = new EC(CURVE)

/**
 * Getting an address by public key
 * @param {string} publicKeyHex - Public key in hex
 * @param {string} prefix - Address prefix
 * @returns {string} Binance address
 */

export function getBnbAddressByPublicKey (publicKeyHex, prefix = 'bnb') {
  const pubKey = ec.keyFromPublic(publicKeyHex, "hex")
  const pubPoint = pubKey.getPublic()
  const compressed = pubPoint.encodeCompressed()
  const hexed = crypto.ab2hexstring(compressed)
  const hash = crypto.sha256ripemd160(hexed)

  return encodeAddress(hash, prefix)
}

/**
 * Encodes an address from input data bytes.
 * @param {string} value the public key to encode
 * @param {*} prefix the address prefix
 * @param {*} type the output type (default: hex)
 */

export function encodeAddress (value, prefix = 'bnb', type = 'hex') {
  let words

  if (Buffer.isBuffer(value)) {
    words = bech32.toWords(Buffer.from(value))
  } else {
    words = bech32.toWords(Buffer.from(value, type))
  }

  return bech32.encode(prefix, words)
}

/**
 * Decodes an address in bech32 format.
 * @category crypto
 * @param {string} value the bech32 address to decode
 */
export const decodeAddress = (value) => {
  const decodeAddress = bech32.decode(value)
  return Buffer.from(bech32.fromWords(decodeAddress.words))
}
