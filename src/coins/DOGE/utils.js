import * as bitcoin from 'bitcoinjs-lib'
import * as coininfo from 'coininfo'
import CustomError from '@/helpers/handleErrors'
import ECPairFactory from 'ecpair'
import * as tinysecp from "tiny-secp256k1"

const ECPair = ECPairFactory(tinysecp)
export const validator = (pubkey, msghash, signature) => ECPair.fromPublicKey(pubkey).verify(msghash, signature)

const DOGE = coininfo.dogecoin.main
const FORMAT = DOGE.toBitcoinJS()
const NET_GAIN = {
  messagePrefix: '\x19' + FORMAT.name + ' Signed Message:\n',
  bip32: {
    public: FORMAT.bip32.public,
    private: FORMAT.bip32.private
  },
  pubKeyHash: FORMAT.pubKeyHash,
  scriptHash: FORMAT.scriptHash,
  wif: FORMAT.wif
}
/**
 * Getting Dogecoin address by node and derivation index
 * @param {Object} node - Input data for a transaction
 * @param {number} childIndex - Derivation index
 * @returns {string} Returns address
 */

export function getDogeAddress(node, childIndex) {
  try {
    const pubKey = node.deriveChild(childIndex).publicKey
    const address = bitcoin.payments.p2pkh({pubkey: pubKey, network: NET_GAIN})
    return address.address
  }
  catch (e) {
    console.log(e)
    throw new CustomError('err_core_doge_address')
  }
}

export function getDogeAddressBuyPublicKey(pubKey) {
  try {
    const address = bitcoin.payments.p2pkh({pubkey: pubKey, network: NET_GAIN})
    return address.address
  }
  catch (e) {
    console.log(e)
    throw new CustomError('err_core_doge_address')
  }
}

/**
 * Creating a raw Dogecoin transaction
 * @param {Object} data - Input data for a transaction
 * @param {Array} data.inputs - List of inputs
 * @param {Array} data.outputs - List of outputs
 * @returns {Object} Returns raw Dogecoin transaction and transaction hash
 */

export function makeRawDogeTx({inputs = [], outputs = []}) {
  try {
    const curr = coininfo.dogecoin.main
    const frmt = curr.toBitcoinJS()
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

    const psbt = new bitcoin.Psbt({network: netGain, maximumFeeRate: 2000000})
    let keyPairs = []
    psbt.setVersion(1)

    for (let [i, input] of inputs.entries()) {
      const keyPair = ECPair.fromWIF(input.key)
      keyPair.network = netGain
      keyPairs.push(keyPair)

      let data = {
        hash: input.hash,
        index: input.index
      }
      data.nonWitnessUtxo = Buffer.from(input.tx, 'hex')

      try {
        psbt.addInput(data)
      }
      catch (e) {
        if (e.message === 'RangeError: value out of range') {
          delete psbt.data.inputs[i].nonWitnessUtxo
          const p2pkh = bitcoin.payments.p2pkh({pubkey: keyPair.publicKey, network: netGain})
          const script = p2pkh.output.toString('hex')

          psbt.updateInput(i, {
            witnessUtxo: {
              script: Buffer.from(script, 'hex'),
              value: input.value
            }
          })
          psbt.__CACHE.__UNSAFE_SIGN_NONSEGWIT = true
        } else {
          console.log('addInput error', e)
          throw new CustomError(e.message)
        }
      }
    }

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
    throw new CustomError('err_tx_doge_build')
  }
}
