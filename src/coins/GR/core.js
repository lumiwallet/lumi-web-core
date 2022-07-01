import {generateEthCore} from '@/coins/ETH/core'
// /**
//  * Creating a core for Ethereum.
//  * At the output, we get a Ethereum node, derivation path,
//  * a private and public key, and the Ethereum address
//  *
//  * @param {string} hdkey - A hierarchical deterministic key
//  * @private
//  */

export function generateGCore (hdkey) {
  return generateEthCore(hdkey)
}
