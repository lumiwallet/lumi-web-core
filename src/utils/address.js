import bech32 from 'bech32'
import * as crypto from '@/utils/crypto'
import { ec as EC } from "elliptic"

const CURVE = "secp256k1"
const ec = new EC(CURVE)

// toBech32(data: Buffer, version: number, prefix: string): string;
export function toBech32 (data, version, prefix) {
  const words = bech32.toWords(data);
  words.unshift(version);
  return bech32.encode(prefix, words);
}

export function getAddressFromPublicKey (publicKeyHex, prefix = 'bnb') {
  const pubKey = ec.keyFromPublic(publicKeyHex, "hex")
  const pubPoint = pubKey.getPublic()
  const compressed = pubPoint.encodeCompressed()
  const hexed = crypto.ab2hexstring(compressed)
  const hash = crypto.sha256ripemd160(hexed)
  
  return encodeAddress(hash, prefix)
}

export function encodeAddress (value, prefix = 'bnb', type = 'hex') {
  let words
  
  if (Buffer.isBuffer(value)) {
    words = bech32.toWords(Buffer.from(value))
  } else {
    words = bech32.toWords(Buffer.from(value, type))
  }
  
  return bech32.encode(prefix, words)
}
