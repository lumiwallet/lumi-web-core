import bigDecimal from 'js-big-decimal'
import * as crypto from '@/utils/crypto'
import {generateSignature, convertToJager, convertToBinance} from '@/class/BNB/utils'
import {decodeAddress} from '@/class/BNB/address'
import {
  convertObjectToSignBytes,
  marshalBinary,
  AminoPrefix
} from '@/class/BNB/amino'

const DEFAULT_CHAIN_ID = 'Binance-Chain-Tigris'
const DEFAULT_SOURCE = 1

/**
 * Class BinanceTx.
 * This class is responsible for calculating the fee list
 * and generating and signing a Binance transaction
 * @class
 */

export default class BinanceTx {
  /**
   * Create a BinanceTx
   * @param {Object} data - Input data for generating a transaction and calculating a fee
   * @param {number} data.chain_id
   * @param {string} data.address - Sender's address
   * @param {number} data.account_number
   * @param {number} data.sequence
   * @param {number} data.source
   * @param {Array} data.fee - Fee list
   * @param {Array} data.balance - Sender's balance
   * @param {string} data.privateKey
   * @param {string} data.publicKey
   */

  constructor (data) {
    data = data || {}
    this.chain_id = data.chain_id || DEFAULT_CHAIN_ID
    this.address = data.address
    this.account_number = data.account_number || 0
    this.sequence = data.sequence
    this.source = Number.isInteger(data.source) || DEFAULT_SOURCE
    this.fee = data.fee || []
    this.balance = convertToJager(data.balance)
    this.privateKey = data.privateKey
    this.publicKey = data.publicKey
    this.memo = ''
    this.msg = []
    this.signatures = []
    this.feeList = []
  }

  /**
   * Calculating a fee list
   * @returns {Array} Returns a set of fees
   */

  calcFee () {
    for (let item of this.fee) {
      let fee = {
        id: item.name.toLowerCase(),
        fee: convertToBinance(item.fee),
        value: item.fee
      }

      this.feeList.push(fee)
    }
    return this.feeList
  }

  /**
   * sign transaction with a given private key and msg
   * @param {Object} data - Input data for a transaction
   * @param {string} data.addressTo - Recipient address
   * @param {number} data.amount - The transaction amount
   * @param {number} data.fee - The transaction fee
   * @param {string} data.memo - The transaction memo
   * @return {Transaction}
   **/

  make (data) {
    this.memo = data.memo || ''
    this.msg = this.getSignMsg(data)
    const signBytes = this.getSignBytes(this.msg)
    const privKeyBuf = Buffer.from(this.privateKey, 'hex')
    const signature = generateSignature(
      signBytes.toString('hex'),
      privKeyBuf
    )
    this.addSignature(this.publicKey, signature)
    return this
  }

  /**
   * Getting signed transaction message
   * @returns {Object}
   */

  getSignMsg (data) {
    const {addressTo, amount, fee} = data
    const feeInJager = convertToJager(fee)
    const amountInJager = convertToJager(amount)
    const fullAmount = bigDecimal.add(feeInJager, amountInJager)
    const change = bigDecimal.subtract(this.balance, fullAmount)

    if (change < 0) {
      throw new Error('Insufficient balance')
    }

    const inputs = [
      {
        coins: [
          {
            denom: 'BNB',
            amount: +amountInJager
          }
        ],
        address: this.address
      }
    ]

    const outputs = [
      {
        address: addressTo,
        coins: [
          {
            denom: 'BNB',
            amount: +amountInJager
          }
        ]
      }
    ]

    return {
      inputs,
      outputs
    }
  }

  /**
   * Getting the transaction message
   * @returns {Object}
   */

  getMsg (msg) {
    msg.inputs = msg.inputs.map(item => {
      return {
        address: decodeAddress(item.address),
        coins: item.coins
      }
    })
    msg.outputs = msg.outputs.map(item => {
      return {
        address: decodeAddress(item.address),
        coins: item.coins
      }
    })

    msg.aminoPrefix = AminoPrefix.msg
    return msg
  }

  /**
   * Generate the sign bytes for a transaction, given a msg
   * @param {Object} msg - msg object
   * @return {Buffer}
   */

  getSignBytes (msg) {
    const signMsg = {
      account_number: this.account_number.toString(),
      chain_id: this.chain_id,
      data: null,
      memo: this.memo,
      msgs: [msg],
      sequence: this.sequence.toString(),
      source: this.source.toString()
    }
    return convertObjectToSignBytes(signMsg)
  }

  /**
   * Attaches a signature to the transaction
   * @param {string} pubKey
   * @param {Buffer} signature
   */

  addSignature (pubKey, signature) {
    const pubKeyBuf = this._serializePubKey(Buffer.from(this.publicKey, 'hex')) // => Buffer

    this.signatures = [
      {
        pub_key: pubKeyBuf,
        signature: signature,
        account_number: this.account_number,
        sequence: this.sequence
      }
    ]

    return this
  }

  /**
   * Encode signed transaction to hex which is compatible with amino
   * @returns {string}
   */

  serialize () {
    if (!this.signatures) {
      throw new Error('need signature')
    }
    const msg = this.getMsg(this.msg)

    const stdTx = {
      msg: [msg],
      signatures: this.signatures,
      memo: this.memo,
      source: this.source,
      data: '',
      aminoPrefix: AminoPrefix.tx
    }

    const bytes = marshalBinary(stdTx)
    this.rawTx = bytes.toString('hex')
    return this.rawTx
  }

  /**
   * Getting the transaction hash
   * @returns {string}
   */

  getHash () {
    if (this.rawTx) {
      return crypto.sha256(this.rawTx).toUpperCase()
    }

    return ''
  }

  /**
   * Serializes a public key in a 33-byte compressed format.
   * @param {Buffer} unencodedPubKey
   * @return {Buffer}
   */

  _serializePubKey (unencodedPubKey) {
    let pubBz = crypto.encodeBinaryByteArray(unencodedPubKey)
    pubBz = Buffer.concat([Buffer.from(AminoPrefix.PubKeySecp256k1, 'hex'), pubBz])

    return pubBz
  }
}
