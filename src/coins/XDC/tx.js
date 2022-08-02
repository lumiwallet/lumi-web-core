import {makeRawEthTx} from '../ETH/utils'
import CustomError from '@/helpers/handleErrors'
import converter from '@/helpers/converters'
import {CoinsNetwork} from '@lumiwallet/lumi-network'
import bigDecimal from 'js-big-decimal'

const requests = CoinsNetwork.xdc
const DEFAULT_ETH_GAS_LIMIT = 21000
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
   * @param {number} data.balance - XinFin wallet balance
   * @param {number} data.gasPrice - Gas price for transaction
   */
  constructor(data) {
    this.address = data.address
    this.balance = data.balance
    this.gasPrice = data.gasPrice || 250000000
    this.gasLimit = DEFAULT_ETH_GAS_LIMIT
    this.feeInGwei = +bigDecimal.multiply(this.gasPrice, this.gasLimit)
    this.finalFee = +converter.wei_to_eth(this.feeInGwei, 14, false)
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
        gasPriceGwei: converter.wei_to_gwei(this.gasPrice),
        fee: this.finalFee,
        coinValue: this.finalFee,
        value: this.feeInGwei
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
    const {addressTo, amount, fee, privateKey} = data
    const amountInWei = converter.eth_to_wei(amount)
    const finalAmount = +bigDecimal.add(amountInWei, fee.value)
    const surrender = bigDecimal.subtract(this.balance, finalAmount)

    if (surrender < 0) {
      throw new CustomError('err_tx_xdc_balance')
    }

    let nonce
    try {
      nonce = await requests.getNonce(this.address)
    } catch (e) {
      throw new Error('getNonce e', e.message)
    }

    let params = {
      to: addressTo,
      value: amountInWei,
      nonce,
      gasPrice: this.gasPrice,
      gasLimit: this.gasLimit,
      privateKey: privateKey,
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
