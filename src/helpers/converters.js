import bigDecimal from 'js-big-decimal'

/**
 * Bitcoin and Ethereum converter
 */
const BTC_FACTOR = Math.pow(10, 8)
const ETH_FACTOR = Math.pow(10, 18)
const BTC_PRECISION = 8
const ETH_PRECISION = 18
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
    sat = +sat
    let n1 = new bigDecimal(sat.toExponential(BTC_PRECISION))
    let n2 = new bigDecimal(BTC_FACTOR.toExponential(BTC_PRECISION))
    let num = n1.divide(n2, customPrecision || PRECISION)
    return returnNumber ? +num.value : removeLastZero(num.value)
  },
  /**
   * Convert Bitcoin to Satoshi
   * @param {number} btc
   * @returns {number} sat
   */
  btc_to_sat (btc) {
    if (!+btc) return 0
    btc = +btc
    let n1 = new bigDecimal(btc.toExponential(BTC_PRECISION))
    let n2 = new bigDecimal(BTC_FACTOR.toExponential(BTC_PRECISION))
    let num = n1.multiply(n2)
    return +bigDecimal.floor(num.value)
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
    wei = +wei
    let n1 = new bigDecimal(wei.toExponential(ETH_PRECISION))
    let n2 = new bigDecimal(ETH_FACTOR.toExponential(ETH_PRECISION))
    let num = n1.divide(n2, customPrecision || PRECISION)
    return returnNumber ? +num.value : removeLastZero(num.value)
  },
  /**
   * Convert Ethereum to WEI
   * @param {number} eth
   * @returns {number} wei
   */
  eth_to_wei (eth) {
    if (!+eth) return 0
    eth = +eth
    let n1 = new bigDecimal(eth.toExponential(ETH_PRECISION))
    let n2 = new bigDecimal(ETH_FACTOR.toExponential(ETH_PRECISION))
    let num = n1.multiply(n2)
    return +bigDecimal.floor(num.value)
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
