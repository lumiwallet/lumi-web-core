/**
 * Bitcoin and Ethereum converter
 */

export default {
  /**
   * Convert Satoshi to Bitcoin
   * @param {number} sat
   * @returns {number} btc
   */
  sat_to_btc (sat) {
    if (!+sat) return 0
    return parseFloat((+sat / Math.pow(10, 8)).toFixed(8))
  },
  /**
   * Convert Bitcoin to Satoshi
   * @param {number} btc
   * @returns {number} sat
   */
  btc_to_sat (btc) {
    if (!+btc) return 0
    return Math.round(+btc * Math.pow(10, 8))
  },
  /**
   * Convert WEI to Ethereum
   * @param {number} wei
   * @returns {number} eth
   */
  wei_to_eth (wei) {
    if (!+wei) return 0
    return parseFloat(+wei / Math.pow(10, 18).toFixed(8))
  },
  /**
   * Convert Ethereum to WEI
   * @param {number} eth
   * @returns {number} wei
   */
  eth_to_wei (eth) {
    if (!+eth) return 0
    return Math.round(+eth * Math.pow(10, 18))
  }
}
