import converter       from '@/helpers/converters'
import toFormatDecimal from '@/helpers/toFormatDecimal'
import {makeRawEthTx}  from '@/helpers/coreHelper'
import CustomError     from '@/helpers/handleErrors'

/**
 * Class EthereumTx.
 * This class is responsible for calculating the fee and generating and signing a Ethereum transaction
 * @class
 */

export default class EthereumTx {
  /**
   * Create a EthereumTx
   * @param {Object} data - Input data for generating a transaction or calculating a fee
   * @param {string} data.address - Ethereum wallet address
   * @param {Array} data.privateKey - Ethereum private key in Uint8Array format
   * @param {number} data.balance - Ethereum wallet balance
   * @param {number} data.gasPrice - Gas price for transaction
   */
  constructor (data) {
    this.address = data.address
    this.privateKey = data.privateKey
    this.balance = data.balance
    this.gasPrice = data.gasPrice
    this.defaultGasLimit = 21000
    this.feeList = []
  }
  
  /**
   * Calculating the fee amount
   * @param {number} customGasPrice - Amount of custom gas price
   * @param {number} customGasLimit - Amount of custom gas limit
   * @returns {Array} A list with the optimal and custom fee
   */
  
  calcFee (customGasPrice = 0, customGasLimit = 0) {
    this.feeList = [
      {
        id: 'optimal',
        gasPrice: this.gasPrice,
        gasLimit: this.defaultGasLimit,
        fee: toFormatDecimal(
          converter.wei_to_eth(this.gasPrice * this.defaultGasLimit)
        )
      },
      {
        custom: true,
        id: 'custom',
        gasPrice: customGasPrice,
        gasLimit: customGasLimit,
        fee: toFormatDecimal(
          converter.wei_to_eth(customGasPrice * customGasLimit)
        )
      }
    ]
    
    return this.feeList
  }
  
  /**
   * Creating a transaction
   * @param {Object} data - Input data for a transaction
   * @param {string} data.addressTo - Recipient address
   * @param {number} data.amount - Transaction amount in ETH
   * @param {Object} data.fee - Object with amount of gas price and gas limit
   * @param {number} data.nonce - Nonce, transaction count of an account
   * @returns {Promise<Object>} Return a raw transaction in hex to send and transaction hash
   */
  
  async make (data) {
    const {addressTo, value, fee, nonce} = data
    const amountInWei = converter.eth_to_wei(value)
    const surrender = this.balance - (amountInWei + fee.gasPrice * fee.gasLimit)
    
    if (surrender < 0) {
      throw new CustomError('err_tx_eth_balance')
    }
    
    let params = {
      to: addressTo,
      value: amountInWei,
      nonce,
      gasPrice: fee.gasPrice,
      gasLimit: fee.gasLimit,
      privateKey: this.privateKey
    }
    
    return makeRawEthTx(params)
  }
  
  get DATA () {
    return {
      fee: this.feeList
    }
  }
}
