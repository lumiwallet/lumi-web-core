import * as bitcoin from 'bitcoinjs-lib'
import {validator} from '@/helpers/coreHelpers'

/**
 * Calculating the transaction size by the number of inputs and outputs
 * @param {number} i - Number of inputs. By default 1
 * @param {number} o - Number of outputs. By default 2
 * @param {boolean} isWitness - Flag signaling that there is a witness in the transaction
 * @returns {number} Transaction size
 */

export function calcBtcTxSize(i = 1, o = 2, isWitness = false) {
  let result = 0

  if (isWitness) {
    let base_size = (41 * i) + (32 * o) + 10
    let total_size = (149 * i) + (32 * o) + 12

    result = ((3 * base_size) + total_size) / 4
  } else {
    result = i * 148 + o * 34 + 10
  }

  return Math.ceil(result)
}

/**
 * Creating a raw Bitcoin transaction
 * @param {Object} data - Input data for a transaction
 * @param {Array} data.inputs - List of inputs
 * @param {Array} data.outputs - List of outputs
 * @returns {Object} Returns raw Bitcoin transaction and transaction hash
 */

export function makeRawBtcTx(data = {}) {
  try {
    const {inputs, outputs} = data
    const psbt = new bitcoin.Psbt()
    let keyPairs = []

    psbt.setVersion(1)

    inputs.forEach(input => {
      const isSegwit = input.address.substring(0, 3) === 'bc1'
      const keyPair = ECPair.fromWIF(input.key)
      keyPairs.push(keyPair)

      let data = {
        hash: input.hash,
        index: input.index
      }

      if (isSegwit) {
        const p2wpkh = bitcoin.payments.p2wpkh({pubkey: keyPair.publicKey})
        const script = p2wpkh.output.toString('hex')

        data.witnessUtxo = {
          script: Buffer.from(script, 'hex'),
          value: input.value
        }
      } else {
        data.nonWitnessUtxo = Buffer.from(input.tx, 'hex')
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
