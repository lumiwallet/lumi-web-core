import * as bitcoin from 'bitcoinjs-lib'
import * as coininfo from 'coininfo'

/**
 * Getting Litecoin address by node and derivation index
 * @param {Object} node - Input data for a transaction
 * @param {number} childIndex - Derivation index
 * @returns {string} Returns address
 */

export function getLtcAddress(node, childIndex) {
  try {
    let curr = coininfo.litecoin.main
    let frmt = curr.toBitcoinJS()
    const ltc_testnet = {
      messagePrefix: '\x19' + frmt.name + ' Signed Message:\n',
      bech32: 'ltc',
      bip32: {
        public: frmt.bip32.public,
        private: frmt.bip32.private
      },
      pubKeyHash: frmt.pubKeyHash,
      scriptHash: frmt.scriptHash,
      wif: frmt.wif
    }

    const address = bitcoin.payments.p2wpkh({pubkey: node.deriveChild(childIndex).publicKey, network: ltc_testnet})
    return address.address
  }
  catch (e) {
    console.log(e)
    throw new CustomError('err_core_ltc_address')
  }
}
