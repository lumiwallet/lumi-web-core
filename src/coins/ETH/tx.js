import converter from '@/helpers/converters'
import CustomError from '@/helpers/handleErrors'
import {makeRawEthTx} from './utils'
import abi from './tokens/abi-erc20.json'
import {CoinsNetwork} from '@lumiwallet/lumi-network'
import bigDecimal from 'js-big-decimal'
import Web3 from 'web3'

const requests = CoinsNetwork.eth
const DEFAULT_ETH_GAS_LIMIT = 21000
// const DEFAULT_TOKEN_GAS_LIMIT = 250000
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
    this.gasLimit = data.gasLimit || DEFAULT_ETH_GAS_LIMIT
    this.token = data.token || null
    this.infuraUrl = data.infuraUrl
    this.feeList = []
    this.web3 = null
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

    this.feeList = [
      {
        id: 'optimal',
        gasPrice: this.gasPrice,
        gasLimit: this.gasLimit,
        gasPriceGwei: converter.wei_to_gwei(this.gasPrice),
        coinValue: +converter.wei_to_eth(+bigDecimal.multiply(this.gasPrice, this.gasLimit)),
        value: +bigDecimal.multiply(this.gasPrice, this.gasLimit)
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

  async makeTokenTx(data) {
    if (!this.web3) {
      await this.createWeb3()
    }

    let contract
    try {
      contract = new this.web3.eth.Contract(abi, this.token.contract, {from: this.address})
    }
    catch (error) {
      console.log('contract error', error)
      throw new Error('contract error', error.message)
    }

    const {address, fee, privateKey} = data
    let decimals = this.token.decimals
    let amount = parseFloat(data.amount)
    const transferAmount = +bigDecimal.multiply(amount, decimals)
    const surrender = this.balance - transferAmount

    if (surrender < 0) {
      throw new CustomError('err_tx_eth_balance')
    }

    let nonce
    try {
      nonce = await requests.getNonce(this.address)
    }
    catch (e) {
      throw new Error('getNonce error', e.message)
    }
    let decimalsBN, amountBN, amountHex, amountFormat

    if (!Number.isInteger(amount)) {
      let countDecimals = amount.toString().split('.')[1].length
      countDecimals = countDecimals < decimals ? countDecimals : decimals
      amountFormat = Math.floor(amount * Math.pow(10, countDecimals))
      decimals -= countDecimals
    } else {
      amountFormat = amount
    }

    decimalsBN = this.web3.utils.toBN(decimals)
    amountBN = this.web3.utils.toBN(amountFormat)
    amountHex = '0x' + amountBN.mul(this.web3.utils.toBN(10).pow(decimalsBN)).toString('hex')


    let params = {
      from: this.address,
      to: this.token.contract,
      gasPrice: fee.gasPrice,
      gasLimit: fee.gasLimit,
      data: contract.methods.transfer(address, amountHex).encodeABI(),
      chainId: 1,
      value: 0,
      nonce,
      privateKey
    }

    return makeRawEthTx(params)
  }

  createWeb3() {
    if (!this.infuraUrl) {
      throw new Error('No infura url')
    }

    this.web3 = new Web3(this.infuraUrl)
  }

  get DATA() {
    return {
      fee: this.feeList
    }
  }
}
