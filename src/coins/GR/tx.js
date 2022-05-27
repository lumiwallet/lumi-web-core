import converter from '@/helpers/converters'
import bigDecimal from 'js-big-decimal'
import {makeRawEthTx} from '../ETH/utils'
import CustomError from '@/helpers/handleErrors'
import FeeContractAbi from './abi/activate_account.json'
import Web3 from 'web3'
import {
  NODE_URL,
  DEFAULT_GAS_PRICE,
  DEFAULT_GAS_LIMIT,
  SEPARATOR,
  ENTRYPOINT_NODE_ADDR,
  CHAIN_ID,
  FEE_CONTRACT_ADDR
} from './config'

export const web3 = new Web3(NODE_URL)

export default class GraphiteTx {
  constructor({address, balance, gasPrice, gasLimit}) {
    this.address = address
    this.balance = balance
    this.gasPrice = gasPrice || DEFAULT_GAS_PRICE
    this.gasLimit = gasLimit || DEFAULT_GAS_LIMIT
    this.feeList = []
  }

  calcFee(customGasPriceGwei = 0, customGasLimit = 0) {
    customGasPriceGwei = +customGasPriceGwei
    customGasLimit = +customGasLimit
    const customGasPriceWei = converter.gwei_to_wei(customGasPriceGwei)

    this.feeList = [
      {
        id: 'optimal',
        gasPrice: this.gasPrice,
        gasPriceGwei: converter.wei_to_gwei(this.gasPrice),
        gasLimit: this.gasLimit,
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

  calcActivationAmount() {
    const value = +bigDecimal.multiply(this.gasPrice, this.gasLimit)
    return {
      value,
      coinValue: +converter.wei_to_eth(value),
      gasPrice: this.gasPrice,
      gasLimit: this.gasLimit
    }
  }

  async activateAccount({privateKey}) {
    const fee = this.calcActivationAmount()
    const feeContract = new web3.eth.Contract(FeeContractAbi, FEE_CONTRACT_ADDR)
    const tx = feeContract.methods.pay()
    const methodEncoded = tx.encodeABI()
    const data = SEPARATOR.concat(web3.utils.hexToBytes(ENTRYPOINT_NODE_ADDR)).concat(web3.utils.hexToBytes(methodEncoded))
    const nonce = await this.getNonce()
    const params = {
      from: this.address,
      to: FEE_CONTRACT_ADDR,
      nonce,
      gasPrice: fee.gasPrice,
      gasLimit: fee.gasLimit,
      privateKey,
      data: web3.utils.bytesToHex(data),
      chainId: CHAIN_ID
    }

    return makeRawEthTx(params)
  }

  async make({address, amount, fee, privateKey}) {
    const amountInWei = converter.eth_to_wei(amount)
    const finalAmount = +bigDecimal.add(amountInWei, fee.value)
    const surrender = bigDecimal.subtract(this.balance, finalAmount)

    if (surrender < 0) {
      throw new CustomError('err_tx_eth_balance')
    }

    const nonce = await this.getNonce()
    const txData = SEPARATOR.concat(web3.utils.hexToBytes(ENTRYPOINT_NODE_ADDR))

    const params = {
      from: this.address,
      to: address,
      value: amountInWei,
      nonce,
      gasPrice: fee.gasPrice,
      gasLimit: fee.gasLimit,
      privateKey,
      data: web3.utils.bytesToHex(txData),
      chainId: CHAIN_ID
    }

    return makeRawEthTx(params)
  }

  async getNonce() {
    let nonce
    try {
      nonce = await web3.eth.getTransactionCount(this.address)

      return nonce
    }
    catch (e) {
      throw new Error('getNonce e', e.message)
    }
  }

  get DATA() {
    return {
      fee: this.feeList
    }
  }
}
