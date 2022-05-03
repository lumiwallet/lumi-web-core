import * as bitcoin from 'bitcoinjs-lib'
import * as coininfo from 'coininfo'
import CustomError from '@/helpers/handleErrors'

/**
 * Getting Dogecoin address by node and derivation index
 * @param {Object} node - Input data for a transaction
 * @param {number} childIndex - Derivation index
 * @param {boolean} withoutPrefix - Flag for prefix
 * @returns {string} Returns address
 */

export function getDogeAddress(node, childIndex, withoutPrefix = true) {
  try {
    let curr = coininfo.dogecoin.main
    let frmt = curr.toBitcoinJS()
    const netGain = {
      messagePrefix: '\x19' + frmt.name + ' Signed Message:\n',
      bip32: {
        public: frmt.bip32.public,
        private: frmt.bip32.private
      },
      pubKeyHash: frmt.pubKeyHash,
      scriptHash: frmt.scriptHash,
      wif: frmt.wif
    }
    const address = bitcoin.payments.p2pkh({pubkey: node.deriveChild(childIndex).publicKey, network: netGain})
    return address.address
  }
  catch (e) {
    console.log(e)
    throw new CustomError('err_core_doge_address')
  }
}
