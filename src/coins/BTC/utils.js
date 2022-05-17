import * as bitcoin from 'bitcoinjs-lib'
import {networks} from '@/helpers/networks'
import CustomError from '@/helpers/handleErrors'
import {privateKeyToWIF} from '@/helpers/core'
import ECPairFactory from 'ecpair'
import * as ecc from 'tiny-secp256k1'

const ECPair = ECPairFactory(ecc)
const validator = (pubkey, msghash, signature) => ECPair.fromPublicKey(pubkey).verify(msghash, signature)

/**
 * Getting a bitcoin address by node and child index
 * @param {Object} node - HDkey node
 * @param {number} childIndex - Index of the child node
 * @param {string} type - Bitcoin type. There may be p2pkh or p2wpkh
 * @param {string} network - Custom network for different coins
 * @returns {string} Bitcoin address
 */

export function getBtcAddress(node, childIndex = 0, type = 'p2pkh', network = 'btc') {
  const types = ['p2pkh', 'p2wpkh']

  if (!types.includes(type)) {
    throw new CustomError('err_core_btc_type')
  }

  try {
    let pubKey = node.deriveChild(childIndex).publicKey

    return bitcoin.payments[type]({
      pubkey: pubKey,
      network: networks[network] || network.btc
    }).address
  }
  catch (e) {
    console.log(e)
    throw new CustomError('err_core_btc_address')
  }
}

/**
 * Getting an address by public key
 * @param {string} key - Coin public key
 * @param {string} type - Bitcoin type. There may be p2pkh or p2wpkh
 * @param {string} network - Custom network for different coins
 * @returns {string} Bitcoin address
 */

export function getBtcAddressByPublicKey(key, type = 'p2pkh', network = 'btc') {
  if (!key) return ''

  try {
    return bitcoin.payments[type]({
      pubkey: new Buffer(key, 'hex'),
      network: networks[network]
    }).address
  }
  catch (e) {
    console.log(e)
    throw new CustomError('err_core_btc_address')
  }

}

/**
 * Getting Bitcoin private key for address by derivation index
 * @param {Object} node - Input data for a transaction
 * @param {number} index - Derivation index
 * @returns {string} Returns Private key in WIF format
 */

export function getBtcPrivateKeyByIndex(node, index) {
  try {
    const key = node.deriveChild(index).privateKey

    return privateKeyToWIF(key)
  }
  catch (e) {
    throw new CustomError('err_btc_private_key_by_index')
  }
}


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
    console.log('inputs', inputs)
    console.log('outputs', outputs)
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
