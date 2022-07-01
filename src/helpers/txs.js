import Common, {Chain} from '@ethereumjs/common'
import {Transaction}   from '@ethereumjs/tx'
import * as ethUtil    from 'ethereumjs-util'

/**
 * Creating a raw Ethereum or Xinfin transaction
 * @param {Object} data - Input data for a transaction
 * @param {string} data.to - Recipient address or contract address
 * @param {number} data.value - Transaction amount
 * @param {number} data.nonce - Nonce, transaction count of an account
 * @param {number} data.gasPrice - Transaction gas price
 * @param {number} data.gasLimit - Transaction gas limit
 * @param {string} data.from - Ethereum sender address (required for ERC20 transactions)
 * @param {string} data.chainId - Ethereum chain number
 * @param {string} data.data - Data in hex representation (required for ERC20 transactions)
 * @param {string|Buffer} data.privateKey - Ethereum private key in hex or Buffer format
 * @returns {Object} Returns raw Ethereum transaction and transaction hash
 */

export function makeRawEthTx(data = {}) {
  let {to} = data
  const {value, nonce, gasPrice, gasLimit, privateKey, chainId} = data

  if (isNaN(nonce) || isNaN(value) || isNaN(gasPrice) ||
    isNaN(gasLimit)) {
    throw new CustomError('err_tx_eth_invalid_params')
  }

  if (typeof to !== 'string') {
    throw new CustomError('err_tx_eth_invalid_params_string')
  }

  try {
    if (to.startsWith('xdc')) {
      to = to.replace('xdc', '0x')
    }
    let bigIntValue = BigInt(value)
    let params = {
      to: to,
      nonce: ethUtil.intToHex(parseInt(nonce)),
      value: ethUtil.bnToHex(bigIntValue),
      gasPrice: ethUtil.intToHex(parseInt(gasPrice)),
      gasLimit: ethUtil.intToHex(parseInt(gasLimit))
    }

    if (data.hasOwnProperty('from') && data.from) {
      params.from = data.from
    }
    if (data.hasOwnProperty('data') && data.data) {
      params.data = data.data
    }
    let common
    if (chainId) {
      common = Common.custom({chainId})
    } else {
      common = new Common(({chain: Chain.Mainnet}))
    }

    const tx = Transaction.fromTxData(params, {common})

    let buffer
    if (typeof privateKey === 'string') {
      buffer = Buffer.from(privateKey?.replace('0x', ''), 'hex')
    } else {
      buffer = privateKey
    }

    const privateKeyBuffer = ethUtil.toBuffer(buffer)
    const signedTx = tx.sign(privateKeyBuffer)
    const serializedTx = signedTx.serialize()
    const hash = signedTx.hash().toString('hex')

    return {
      hash: `0x${ hash }`,
      tx: `0x${ serializedTx.toString('hex') }`
    }
  }
  catch (e) {
    console.log(e)
    throw new CustomError('err_tx_eth_build')
  }
}
