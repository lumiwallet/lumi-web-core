import bigDecimal from 'js-big-decimal'

/**
 * Bitcoin and Ethereum converter
 */
const BTC_FACTOR = Math.pow(10, 8)
const ETH_FACTOR = Math.pow(10, 18)
const PRECISION = 10

export default {
  /**
   * Convert Satoshi to Bitcoin
   * @param {number} sat
   * @param {number} customPrecision
   * @param {boolean} returnNumber
   * @returns {number} btc
   */
  sat_to_btc (sat, customPrecision, returnNumber = true) {
    if (!+sat) return 0
    let value = bigDecimal.divide(sat, BTC_FACTOR, customPrecision || PRECISION)
    return returnNumber ? +value : removeLastZero(value)
  },
  /**
   * Convert Bitcoin to Satoshi
   * @param {number} btc
   * @returns {number} sat
   */
  btc_to_sat (btc) {
    if (!+btc) return 0
    let value = bigDecimal.multiply(btc, BTC_FACTOR)
    return +bigDecimal.floor(value)
  },
  /**
   * Convert WEI to Ethereum
   * @param {number} wei
   * @param {number} customPrecision
   * @param {boolean} returnNumber
   * @returns {number} eth
   */
  wei_to_eth (wei, customPrecision, returnNumber = true) {
    if (!+wei) return 0
    let value = bigDecimal.divide(wei, ETH_FACTOR, customPrecision || PRECISION)
    return returnNumber ? +value : removeLastZero(value)
  },
  /**
   * Convert Ethereum to WEI
   * @param {number} eth
   * @returns {number} wei
   */
  eth_to_wei (eth) {
    if (!+eth) return 0
    let value = bigDecimal.multiply(eth, ETH_FACTOR)
    return +bigDecimal.floor(value)
  }
}

function removeLastZero(value) {
  if (!value) return ''

  let num = value.toString()

  while (num[num.length - 1] === '0') {
    num = num.slice(0, -1)
  }

  if (num[num.length - 1] === '.') {
    num = num.slice(0, -1)
  }

  return num
}
