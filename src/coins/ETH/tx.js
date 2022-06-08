import converter      from '@/helpers/converters'
import bigDecimal     from 'js-big-decimal'
import {makeRawEthTx} from './utils'
import CustomError    from '@/helpers/handleErrors'
import {CoinsNetwork} from '@lumiwallet/lumi-network'

const requests = CoinsNetwork.eth
const DEFAULT_ETH_GAS_LIMIT = 21000
const DEFAULT_TOKEN_GAS_LIMIT = 250000
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
   * @param {number} data.balance - Ethereum wallet balance
   * @param {number} data.gasPrice - Gas price for transaction
   */
  constructor(data) {
    this.address = data.address
    this.balance = data.balance
    this.gasPrice = data.gasPrice
    this.defaultGasLimit = data.gasLimit || DEFAULT_ETH_GAS_LIMIT
    this.feeList = []
    this.token = data.token || null
    this.estimateTokenGas = null
  }

  /**
   * Calculating the fee amount
   * @param {number} customGasPriceGwei - Amount of custom gas price (in GWEI)
   * @param {number} customGasLimit - Amount of custom gas limit
   * @returns {Array} A list with the optimal and custom fee
   */

  async calcFee(customGasPriceGwei = 0, customGasLimit = 0) {
    customGasPriceGwei = +customGasPriceGwei
    customGasLimit = +customGasLimit
    const customGasPriceWei = converter.gwei_to_wei(customGasPriceGwei)
    let gasLimit = this.defaultGasLimit
    let gasPrice = this.gasPrice

    if (this.token) {
      if (!this.estimateTokenGas) {
        this.estimateTokenGas = await this.getEstimateGas(this.token.contract)
      }
      gasLimit = this.estimateTokenGas.gasLimit
      gasPrice = this.estimateTokenGas.gasPrice
    }

    this.feeList = [
      {
        id: 'optimal',
        gasPrice,
        gasLimit,
        gasPriceGwei: converter.wei_to_gwei(gasPrice),
        coinValue: +converter.wei_to_eth(+bigDecimal.multiply(gasPrice, gasLimit)),
        value: +bigDecimal.multiply(gasPrice, gasLimit)
      },
      {
        custom: true,
        id: 'custom',
        gasPrice: customGasPriceWei,
        gasPriceGwei: customGasPriceGwei,
        gasLimit: customGasLimit,
        coinValue: +converter.wei_to_eth(+bigDecimal.multiply(customGasPriceWei, customGasLimit)),
        value: +bigDecimal.multiply(customGasPriceWei, customGasLimit)
      }
    ]

    return this.feeList
  }

  async getEstimateGas(contract) {
    // TODO: request from network
    const myHeaders = new Headers()
    myHeaders.append('Content-Type', 'application/json')
    const data = {
      contract,
      amount: 1,
      addressTo: '0x0000000000000000000000000000000000000000'
    }

    const res = await fetch('https://api.lumiwallet.com/proxy/infura/ethGas', {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(data)
    })
    const resJson = await res.json()

    if (resJson.status !== 'error') {
      let limit = Math.max(resJson.data.estimateGas, resJson.data.lastEstimateGas)

      return {
        gasLimit: limit > 0 ? limit : DEFAULT_TOKEN_GAS_LIMIT,
        gasPrice: resJson.data.gasPrice
      }
    } else {
      return {
        gasLimit: DEFAULT_TOKEN_GAS_LIMIT,
        gasPrice: this.gasPrice
      }
    }
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

  async make(data) {
    const {address, amount, fee, privateKey} = data
    const amountInWei = converter.eth_to_wei(amount)
    const finalAmount = +bigDecimal.add(amountInWei, fee.value)
    const surrender = bigDecimal.subtract(this.balance, finalAmount)

    if (surrender < 0) {
      throw new CustomError('err_tx_eth_balance')
    }

    let nonce
    try {
      nonce = await requests.getNonce(this.address)
    }
    catch (e) {
      throw new Error('getNonce e', e.message)
    }


    let params = {
      to: address,
      value: amountInWei,
      nonce,
      gasPrice: fee.gasPrice,
      gasLimit: fee.gasLimit,
      privateKey
    }
    return makeRawEthTx(params)
  }

  get DATA() {
    return {
      fee: this.feeList
    }
  }
}
