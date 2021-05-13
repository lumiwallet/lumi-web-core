import hexEncoding from 'crypto-js/enc-hex'
import RIPEMD160 from 'crypto-js/ripemd160'
import SHA256 from 'crypto-js/sha256'

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

// import createHash from 'create-hash/browser'
// // import RIPEMD160 from 'ripemd160'
//
//
// export function sha256 (buffer) {
//   return createHash('sha256')
//     .update(buffer)
//     .digest()
// }
//
// export function ripemd160 (buffer) {
//   try {
//     return createHash('rmd160')
//       .update(buffer)
//       .digest()
//   }
//   catch (err) {
//     return createHash('ripemd160')
//       .update(buffer)
//       .digest()
//   }
// }
//
//
