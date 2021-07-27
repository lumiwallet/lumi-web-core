import bigDecimal from 'js-big-decimal'

/**
 * Bitcoin and Ethereum converter
 */
const BTC_FACTOR = Math.pow(10, 8)
const ETH_FACTOR = Math.pow(10, 18)
const PRECISION = 8

export default {
  /**
   * Convert Satoshi to Bitcoin
   * @param {number} sat
   * @returns {number} btc
   */
  sat_to_btc (sat) {
    if (!+sat) return 0
    return +bigDecimal.divide(sat, BTC_FACTOR, PRECISION)
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
   * @returns {number} eth
   */
  wei_to_eth (wei) {
    if (!+wei) return 0
    return +bigDecimal.divide(wei, ETH_FACTOR, PRECISION)
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
