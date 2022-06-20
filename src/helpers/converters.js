import bigDecimal from 'js-big-decimal'

/**
 * Bitcoin and Ethereum converter
 */
const BTC_FACTOR = Math.pow(10, 8)
const ETH_FACTOR = Math.pow(10, 18)
const GWEI_FACTOR = Math.pow(10, 9)
const PRECISION = 10

export default {
  /**
   * Convert Satoshi to Bitcoin
   * @param {string} sat
   * @param {number} customPrecision
   * @param {boolean} returnNumber
   * @returns {number} btc
   */
  sat_to_btc (sat, customPrecision, returnNumber = true) {
    if (!+sat) return 0
    sat = sat.toString()
    let n1 = new bigDecimal(sat)
    let n2 = new bigDecimal(BTC_FACTOR)
    let num = n1.divide(n2, customPrecision || PRECISION)
    return returnNumber ? +num.value : removeLastZero(num.value)
  },
  /**
   * Convert Bitcoin to Satoshi
   * @param {string} btc
   * @returns {number} sat
   */
  btc_to_sat (btc) {
    if (!+btc) return 0
    btc = btc.toString()
    let n1 = new bigDecimal(btc)
    let n2 = new bigDecimal(BTC_FACTOR)
    let num = n1.multiply(n2)
    return +bigDecimal.floor(num.value)
  },
  /**
   * Convert WEI to Ethereum
   * @param {string} wei
   * @param {number} customPrecision
   * @param {boolean} returnNumber
   * @returns {number} eth
   */
  wei_to_eth (wei, customPrecision, returnNumber = true) {
    if (!+wei) return 0
    wei = wei.toString()
    let n1 = new bigDecimal(wei)
    let n2 = new bigDecimal(ETH_FACTOR)
    let num = n1.divide(n2, customPrecision || PRECISION)
    return returnNumber ? +num.value : removeLastZero(num.value)
  },
  wei_to_gwei(wei) {
    if (!+wei) return 0
    wei = wei.toString()
    let n1 = new bigDecimal(wei)
    let n2 = new bigDecimal(GWEI_FACTOR)
    let num = n1.divide(n2, 0)
    return +num.value
  },
  gwei_to_wei (gwei) {
    if (!+gwei) return 0
    let n1 = new bigDecimal(gwei)
    let n2 = new bigDecimal(GWEI_FACTOR)
    let num = n1.multiply(n2)
    return +bigDecimal.floor(num.value)
  },
  /**
   * Convert Ethereum to WEI
   * @param {string} eth
   * @returns {number} wei
   */
  eth_to_wei (eth) {
    if (!+eth) return 0
    eth = eth.toString()
    let n1 = new bigDecimal(eth)
    let n2 = new bigDecimal(ETH_FACTOR)
    let num = n1.multiply(n2)
    return bigDecimal.floor(num.value)
  }
}

function removeLastZero(value) {
  if (!value) return 0

  let num = value.toString()
  if(!num.includes('.')) return num

  while (num[num.length - 1] === '0') {
    num = num.slice(0, -1)
  }

  if (num[num.length - 1] === '.') {
    num = num.slice(0, -1)
  }

  return num
}
