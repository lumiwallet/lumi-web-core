/*
 * https://github.com/binance-chain/javascript-sdk/blob/master/src/amino/encoder/index.ts
 */

import is from "is_js"
import { string as VarString } from "protocol-buffers-encodings"
import {UVarInt} from '@/utils/varint'

export const AminoPrefix = {
  tx: 'F0625DEE',
  msg: '2A2C87FA',
  PubKeySecp256k1: 'EB5AE987'
}

const sortObject = (obj) => {
  if (obj === null) return null
  if (typeof obj !== "object") return obj
  if (Array.isArray(obj)) return obj.map(sortObject)
  const sortedKeys = Object.keys(obj).sort()
  const result = {}
  sortedKeys.forEach((key) => {
    result[key] = sortObject(obj[key])
  })
  return result
}

/**
 * encode number
 * @category amino
 * @param num
 */
export const encodeNumber = (num) => UVarInt.encode(num)

/**
 * encode bool
 * @category amino
 * @param b
 */
export const encodeBool = (b) =>
  b ? UVarInt.encode(1) : UVarInt.encode(0)

/**
 * encode string
 * @category amino
 * @param str
 */
export const encodeString = (str) => {
  const buf = Buffer.alloc(VarString.encodingLength(str))
  return VarString.encode(str, buf, 0)
}

/**
 * @category amino
 * @param obj -- {object}
 * @return bytes {Buffer}
 */
export const convertObjectToSignBytes = (obj) =>
  Buffer.from(JSON.stringify(sortObject(obj)))

/**
 * js amino MarshalBinary
 * @category amino
 * @param {Object} obj
 *  */
export const marshalBinary = (obj) => {
  if (!is.object(obj)) throw new TypeError("data must be an object")
  
  return encodeBinary(obj, -1, true).toString("hex")
}

// /**
//  * js amino MarshalBinaryBare
//  * @category amino
//  * @param {Object} obj
//  *  */
// export const marshalBinaryBare = (obj) => {
//   if (!is.object(obj)) throw new TypeError("data must be an object")
//
//   return encodeBinary(obj).toString("hex")
// }

/**
 * This is the main entrypoint for encoding all types in binary form.
 * @category amino
 * @param {*} js data type (not null, not undefined)
 * @param {Number} field index of object
 * @param {Boolean} isByteLenPrefix
 * @return {Buffer} binary of object.
 */
export const encodeBinary = (
  val,
  fieldNum,
  isByteLenPrefix
) => {
  if (val === null || val === undefined) throw new TypeError("unsupported type")
  
  if (Buffer.isBuffer(val)) {
    if (isByteLenPrefix) {
      return Buffer.concat([UVarInt.encode(val.length), val])
    }
    return val
  }
  
  if (is.array(val)) {
    return encodeArrayBinary(fieldNum, val, isByteLenPrefix)
  }
  
  if (is.number(val)) {
    return encodeNumber(val)
  }
  
  if (is.boolean(val)) {
    return encodeBool(val)
  }
  
  if (is.string(val)) {
    return encodeString(val)
  }
  
  if (is.object(val)) {
    return encodeObjectBinary(val, isByteLenPrefix)
  }
  
  return
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

/**
 * @category amino
 * @param {Object} obj
 * @return {Buffer} with bytes length prefixed
 */
export const encodeObjectBinary = (obj, isByteLenPrefix) => {
  const bufferArr = []
  
  Object.keys(obj).forEach((key, index) => {
    if (key === "aminoPrefix" || key === "version") return
    
    if (isDefaultValue(obj[key])) return
    
    if (is.array(obj[key]) && obj[key].length > 0) {
      bufferArr.push(encodeArrayBinary(index, obj[key]))
    } else {
      bufferArr.push(encodeTypeAndField(index, obj[key]))
      bufferArr.push(encodeBinary(obj[key], index, true))
    }
  })
  
  let bytes = Buffer.concat(bufferArr)
  
  // add prefix
  if (obj.aminoPrefix) {
    const prefix = Buffer.from(obj.aminoPrefix, "hex")
    bytes = Buffer.concat([prefix, bytes])
  }
  
  // Write byte-length prefixed.
  if (isByteLenPrefix) {
    const lenBytes = UVarInt.encode(bytes.length)
    bytes = Buffer.concat([lenBytes, bytes])
  }
  
  return bytes
}

/**
 * @category amino
 * @param {Number} fieldNum object field index
 * @param {Array} arr
 * @param {Boolean} isByteLenPrefix
 * @return {Buffer} bytes of array
 */
export const encodeArrayBinary = (
  fieldNum,
  arr,
  isByteLenPrefix
) => {
  const result = []
  
  arr.forEach((item) => {
    result.push(encodeTypeAndField(fieldNum, item))
    
    if (isDefaultValue(item)) {
      result.push(Buffer.from("00", "hex"))
      return
    }
    
    result.push(encodeBinary(item, fieldNum, true))
  })
  
  //encode length
  if (isByteLenPrefix) {
    const length = result.reduce((prev, item) => prev + item.length, 0)
    result.unshift(UVarInt.encode(length))
  }
  
  return Buffer.concat(result)
}

// Write field key.
const encodeTypeAndField = (index, field) => {
  index = Number(index)
  const value = ((index + 1) << 3) | typeToTyp3(field)
  return UVarInt.encode(value)
}

const isDefaultValue = (obj) => {
  if (obj === null) return false
  
  return (
    (is.number(obj) && obj === 0) ||
    (is.string(obj) && obj === "") ||
    (is.array(obj) && obj.length === 0) ||
    (is.boolean(obj) && !obj)
  )
}

const typeToTyp3 = (type) => {
  if (is.boolean(type)) {
    return 0
  }
  
  if (is.number(type)) {
    if (is.integer(type)) {
      return 0
    } else {
      return 1
    }
  }
  
  if (is.string(type) || is.array(type) || is.object(type)) {
    return 2
  }
  
  throw new Error(`Invalid type "${type}"`)
}
