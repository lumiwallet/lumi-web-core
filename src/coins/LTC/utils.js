import * as bitcoin from 'bitcoinjs-lib'
import * as coininfo from 'coininfo'
import CustomError from '@/helpers/handleErrors'
import ECPairFactory from 'ecpair'
import * as tinysecp from "tiny-secp256k1"

const ECPair = ECPairFactory(tinysecp)
export const validator = (pubkey, msghash, signature) => ECPair.fromPublicKey(pubkey).verify(msghash, signature)

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

/**
 * Creating a raw Litecoin transaction
 * @param {Object} data - Input data for a transaction
 * @param {Array} data.inputs - List of inputs
 * @param {Array} data.outputs - List of outputs
 * @returns {Object} Returns raw Litecoin transaction and transaction hash
 */

export function makeRawLtcTx(data = {}) {
  try {
    const {inputs, outputs} = data

    let curr = coininfo.litecoin.main
    let frmt = curr.toBitcoinJS()
    const netGain = {
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

    const psbt = new bitcoin.Psbt({network: netGain, maximumFeeRate: 2000000})
    let keyPairs = []
    psbt.setVersion(1)

    inputs.forEach(input => {
      const keyPair = ECPair.fromWIF(input.key)
      keyPair.network = netGain
      keyPairs.push(keyPair)

      let data = {
        hash: input.hash,
        index: input.index
      }

      const p2wpkh = bitcoin.payments.p2wpkh({pubkey: keyPair.publicKey, network: networks.ltc})
      const script = p2wpkh.output.toString('hex')

      data.witnessUtxo = {
        script: Buffer.from(script, 'hex'),
        value: input.value
      }

      psbt.addInput(data)
    })

    outputs.forEach(output => {
      psbt.addOutput({
        address: output.address,
        value: output.value
      })
    })

    keyPairs.forEach((key, i) => {
      psbt.signInput(i, key)
    })

    psbt.validateSignaturesOfAllInputs(validator)
    psbt.finalizeAllInputs()

    const transaction = psbt.extractTransaction()
    const signedTransaction = transaction.toHex()
    const hash = transaction.getId()

    return {
      hash,
      tx: signedTransaction
    }
  }
  catch (e) {
    console.log(e)
    throw new CustomError('err_tx_ltc_build')
  }
}

