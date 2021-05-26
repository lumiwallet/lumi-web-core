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

export default class BinanceTx {
  constructor (data) {
    data = data || {}
    this.chain_id = data.chain_id || DEFAULT_CHAIN_ID
    this.address = data.address
    this.account_number = data.account_number || 0
    this.sequence = data.sequence
    this.source = data.source || 0
    this.fee = data.fee || []
    this.balance = convertToJager(data.balance)
    this.privateKey = data.privateKey
    this.publicKey = data.publicKey
    this.memo = ''
    this.msg = []
    this.signatures = []
    this.feeList = []
  }
  
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
   * @param {string} privateKey private key hex string
   * @param {SignMsg} concrete msg object
   * @return {Transaction}
   **/
  //todo
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
  
  // todo
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
   * generate the sign bytes for a transaction, given a msg
   * @param {Object} concrete msg object
   * @return {Buffer}
   **/
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
   * attaches a signature to the transaction
   * @param {String} pubKey
   * @param {Buffer} signature
   **/
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
   * encode signed transaction to hex which is compatible with amino
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
      data: "",
      aminoPrefix: AminoPrefix.tx
    }
    
    const bytes = marshalBinary(stdTx)
    this.rawTx = bytes.toString('hex')
    return this.rawTx
  }
  
  //todo
  getHash () {
    if (this.rawTx) {
      return crypto.sha256(this.rawTx).toUpperCase()
    }
    
    return ''
  }
  
  /**
   * serializes a public key in a 33-byte compressed format.
   * @param {Buffer} unencodedPubKey
   * @return {Buffer}
   */
  _serializePubKey (unencodedPubKey) {
    let pubBz = crypto.encodeBinaryByteArray(unencodedPubKey)
    pubBz = Buffer.concat([Buffer.from(AminoPrefix.PubKeySecp256k1, 'hex'), pubBz])
    
    return pubBz
  }
}
