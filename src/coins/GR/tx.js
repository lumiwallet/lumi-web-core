import converter from '@/helpers/converters'
import bigDecimal from 'js-big-decimal'
import {makeRawEthTx} from '../ETH/utils'
import CustomError from '@/helpers/handleErrors'
import FeeContractAbi from './abi/activate_account.json'
import Web3 from 'web3'
import {
  DEFAULT_GAS_PRICE,
  DEFAULT_GAS_LIMIT,
  SEPARATOR,
  CHAIN_ID,
  FEE_CONTRACT_ADDR,
  LEVELS
} from './config'
import {CoinsNetwork} from '@lumiwallet/lumi-network'

const requests = CoinsNetwork.graphite
export const web3 = new Web3()

export default class GraphiteTx {
  constructor({address, balance, gasPrice, gasLimit, header, entrypoint = {}}) {
    this.address = address
    this.balance = balance
    this.gasPrice = gasPrice || DEFAULT_GAS_PRICE
    this.gasLimit = gasLimit || DEFAULT_GAS_LIMIT
    this.feeList = []
    this.entrypoint = {
      isAnonymousNode: entrypoint.isAnonymousNode,
      entrypointNode: entrypoint.entrypointNode
    }
    this.header = header || {}
  }

  async calcFee(customGasPriceGwei = 0, customGasLimit = 0) {
    customGasPriceGwei = +customGasPriceGwei
    customGasLimit = +customGasLimit
    const customGasPriceWei = converter.gwei_to_wei(customGasPriceGwei)
    const estimateGas = await this.getEstimateGas({})

    this.feeList = [
      {
        id: 'optimal',
        gasPrice: this.gasPrice,
        gasPriceGwei: converter.wei_to_gwei(this.gasPrice),
        gasLimit: estimateGas,
        coinValue: +converter.wei_to_eth(+bigDecimal.multiply(this.gasPrice, estimateGas)),
        value: +bigDecimal.multiply(this.gasPrice, estimateGas)
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

  async getEstimateGas({to = '', value = '', data = ''}) {
    try {
      if (!data) {
        if (!this.entrypoint.isAnonymousNode) {
          data = SEPARATOR.concat(web3.utils.hexToBytes(this.entrypoint.entrypointNode))
          data = web3.utils.bytesToHex(data)
        }
      }

      const params = {
        from: this.address,
        value: value || '0x0',
        to: to || this.address,
        data
      }
      const gasAmount = await requests.getEstimateGas(params, this.header)

      return gasAmount || DEFAULT_GAS_LIMIT
    } catch (e) {
      console.log('getEstimateGas e', e)
    }
  }

  async getDataForKycRequest(level) {
    if (!LEVELS.includes(+level)) {
      throw Error('Level must be a number from 1 to 3')
    }
    try {
      const data = await requests.createKycRequest(this.address, level, this.header)
      const fee = +data.gas * this.gasPrice
      const finalValue = +data.value + fee
      data.coinValue = +converter.wei_to_eth(finalValue)

      return data
    }
    catch (e) {
      console.log('getDataForKycRequest e', e.message)
      return e.message
    }
  }

  async getDataForFilterRequest(level) {
    if (!LEVELS.includes(+level)) {
      throw Error('Level must be a number from 0 to 3')
    }
    try {
      const data = await requests.createFilterRequest(this.address, level, this.header)
      const fee = +data.gas * this.gasPrice
      data.coinValue = +converter.wei_to_eth(fee)

      return data
    }
    catch (e) {
      console.log('getDataForFilterRequest e', e.message)
      return e.message
    }
  }

  async changeKycOrFilterLevel(reqData = {}, privateKey, nonce) {
    const {data, from, gas, to, value} = reqData

    const params = {
      value: value || '',
      from,
      to,
      nonce,
      gasPrice: this.gasPrice,
      gasLimit: gas,
      privateKey,
      data,
      chainId: CHAIN_ID
    }

    return makeRawEthTx(params)
  }

  getActivateAccountData() {
    const feeContract = new web3.eth.Contract(FeeContractAbi, FEE_CONTRACT_ADDR)
    const tx = feeContract.methods.pay()
    const methodEncoded = tx.encodeABI()

    let data = ''
    if (!this.entrypoint.isAnonymousNode) {
      data = SEPARATOR.concat(web3.utils.hexToBytes(this.entrypoint.entrypointNode)).concat(web3.utils.hexToBytes(methodEncoded))
      data = web3.utils.bytesToHex(data)
    }

    return data
  }

  async calcActivationAmount() {
    const data = this.getActivateAccountData()
    const initialFee = await requests.getInitialFee(this.header)
    const estimateGas = await this.getEstimateGas({
      data,
      to: FEE_CONTRACT_ADDR,
      value: web3.utils.toHex(initialFee)
    })
    const value = +bigDecimal.multiply(this.gasPrice, estimateGas)

    return {
      value, // TODO: check value + initialFee
      initialFee,
      coinValue: +converter.wei_to_eth(value + initialFee),
      gasPrice: this.gasPrice,
      gasLimit: estimateGas
    }
  }

  async activateAccount({privateKey, nonce}) {
    const data = this.getActivateAccountData()
    const fee = await this.calcActivationAmount(data)
    const params = {
      from: this.address,
      to: FEE_CONTRACT_ADDR,
      chainId: CHAIN_ID,
      value: fee.initialFee,
      gasPrice: fee.gasPrice,
      gasLimit: fee.gasLimit,
      nonce,
      privateKey,
      data
    }

    return makeRawEthTx(params)
  }

  async make({address, amount, fee, privateKey, nonce}) {
    const amountInWei = converter.eth_to_wei(amount)
    const finalAmount = +bigDecimal.add(amountInWei, fee.value)
    const surrender = bigDecimal.subtract(this.balance, finalAmount)

    if (surrender < 0) {
      throw new CustomError('err_tx_eth_balance')
    }

    let data = ''
    if (!this.entrypoint.isAnonymousNode) {
      data = SEPARATOR.concat(web3.utils.hexToBytes(this.entrypoint.entrypointNode))
    }

    const params = {
      from: this.address,
      to: address,
      value: amountInWei,
      nonce,
      gasPrice: fee.gasPrice,
      gasLimit: fee.gasLimit,
      privateKey,
      data: data ? web3.utils.bytesToHex(data) : '',
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
