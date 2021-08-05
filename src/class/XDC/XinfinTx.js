import converter from '@/helpers/converters'
import bigDecimal from 'js-big-decimal'
import {makeRawEthTx} from '@/helpers/coreHelper'
import CustomError from '@/helpers/handleErrors'

const CHAIN_ID = 50

/**
 * Class XinfinTx.
 * This class is responsible for calculating the fee and generating and signing a XinFin transaction
 * @class
 */

export default class XinfinTx {
  /**
   * Create a XinfinTx
   * @param {Object} data - Input data for generating a transaction or calculating a fee
   * @param {string} data.address - XinFin wallet address
   * @param {Array} data.privateKey - XinFin private key in Uint8Array format
   * @param {number} data.balance - XinFin wallet balance
   * @param {number} data.gasPrice - Gas price for transaction
   */
  constructor(data) {
    this.address = data.address
    this.privateKey = data.privateKey
    this.balance = data.balance
    this.gasPrice = 2500
    this.gasLimit = 21000
    this.feeInGwei = +bigDecimal.multiply(this.gasPrice, this.gasLimit)
    this.finalFee = converter.wei_to_eth(this.feeInGwei, 14, false)
    this.feeList = []
  }

  /**
   * Calculating the fee amount
   * @returns {Array} A list with the optimal fee
   */

  calcFee() {
    this.feeList = [
      {
        id: 'optimal',
        gasPrice: this.gasPrice,
        gasLimit: this.gasLimit,
        fee: this.finalFee
      }
    ]

    return this.feeList
  }

  /**
   * Creating a transaction
   * @param {Object} data - Input data for a transaction
   * @param {string} data.addressTo - Recipient address
   * @param {number} data.value - Transaction amount in XDC
   * @returns {Promise<Object>} Return a raw transaction in hex to send and transaction hash
   */

  async make(data) {
    const {addressTo, value, nonce} = data
    const amountInWei = converter.eth_to_wei(value)
    const finalAmount = +bigDecimal.add(amountInWei, this.feeInGwei)
    const surrender = bigDecimal.subtract(this.balance, finalAmount)

    if (surrender < 0) {
      throw new CustomError('err_tx_xdc_balance')
    }

    let params = {
      to: addressTo,
      value: amountInWei,
      nonce,
      gasPrice: this.gasPrice,
      gasLimit: this.gasLimit,
      privateKey: this.privateKey,
      chainId: CHAIN_ID
    }
    return makeRawEthTx(params)
  }

  get DATA() {
    return {
      fee: this.feeList
    }
  }
}
