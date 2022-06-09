import * as bitcoin from "bitcoinjs-lib"
import * as tinysecp from "tiny-secp256k1"
import ECPairFactory from 'ecpair'
import CustomError from '@/helpers/handleErrors'

const ECPair = ECPairFactory(tinysecp)
const validator = (pubkey, msghash, signature) => ECPair.fromPublicKey(pubkey).verify(msghash, signature)

/**
 * Creating a raw Bitcoin Vault transaction
 * @param {Object} data - Input data for a transaction
 * @param {Array} data.inputs - List of inputs
 * @param {Array} data.outputs - List of outputs
 * @returns {Object} Returns raw Bitcoin Vault transaction and transaction hash
 */

export function makeRawBtcvTx(data = {}) {
  try {
    const {inputs, outputs} = data
    const psbt = new bitcoin.Psbt({network: networks.btcv})
    let keyPairs = []
    psbt.setVersion(1)

    inputs.forEach(input => {
      const keyPair = ECPair.fromWIF(input.key, networks.btcv)

      keyPairs.push(keyPair)

      let data = {
        hash: input.hash,
        index: input.index
      }


      const p2wpkh = bitcoin.payments.p2wpkh({pubkey: keyPair.publicKey, network: networks.btcv})
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
    throw new CustomError('err_tx_btc_build')
  }
}
