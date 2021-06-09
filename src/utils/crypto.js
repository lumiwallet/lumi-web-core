import hexEncoding from 'crypto-js/enc-hex'
import RIPEMD160 from 'crypto-js/ripemd160'
import SHA256 from 'crypto-js/sha256'
import SHA3 from 'crypto-js/sha3'
import {UVarInt} from '@/utils/varint'

/**
 * Computes a single SHA256 digest.
 * @param {string} hex message to hash
 * @returns {string} hash output
 */
export const sha256 = (hex) => {
  if (typeof hex !== 'string') throw new Error('sha256 expects a hex string')
  if (hex.length % 2 !== 0) throw new Error(`invalid hex string length: ${ hex }`)
  const hexEncoded = hexEncoding.parse(hex)
  return SHA256(hexEncoded).toString()
}

/**
 * Computes a single SHA3 (Keccak) digest.
 * @param {string} hex message to hash
 * @returns {string} hash output
 */
export const sha3 = (hex) => {
  if (typeof hex !== 'string') throw new Error('sha3 expects a hex string')
  if (hex.length % 2 !== 0) throw new Error(`invalid hex string length: ${ hex }`)
  const hexEncoded = hexEncoding.parse(hex)
  return SHA3(hexEncoded).toString()
}

/**
 * Computes a SHA256 followed by a RIPEMD160.
 * @param {string} hex message to hash
 * @returns {string} hash output
 */
export const sha256ripemd160 = (hex) => {
  if (typeof hex !== 'string')
    throw new Error('sha256ripemd160 expects a string')
  if (hex.length % 2 !== 0) throw new Error(`invalid hex string length: ${ hex }`)
  const hexEncoded = hexEncoding.parse(hex)
  const ProgramSha256 = SHA256(hexEncoded)
  return RIPEMD160(ProgramSha256).toString()
}

/**
 * @param {arrayBuffer} arr
 * @returns {string} HEX string
 */
export const ab2hexstring = (arr) => {
  if (typeof arr !== 'object') {
    throw new Error('ab2hexstring expects an array')
  }
  let result = ''
  for (let i = 0; i < arr.length; i++) {
    let str = arr[i].toString(16)
    str = str.length === 0 ? '00' : str.length === 1 ? '0' + str : str
    result += str
  }
  return result
}

/**
 * prefixed with bytes length
 * @category amino
 * @param {Buffer} bytes
 * @return {Buffer} with bytes length prefixed
 */
export const encodeBinaryByteArray = (bytes) => {
  const lenPrefix = bytes.length

  return Buffer.concat([UVarInt.encode(lenPrefix), bytes])
}
